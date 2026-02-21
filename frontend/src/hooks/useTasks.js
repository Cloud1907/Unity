import { useState, useCallback, useMemo, useRef } from 'react';
import { tasksAPI, subtasksAPI } from '../services/api';
import { normalizeEntity, getId } from '../utils/entityHelpers';
import { updateTaskInTree, findTaskInTree } from '../utils/taskHelpers';
import { toast } from 'sonner';

/** Ref: taskId -> timestamp of last optimistic update. Used by SignalR to ignore stale pushes. */
const lastInteractionByTaskIdRef = { current: {} };

export const useTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);


    const fetchTasks = useCallback(async (projectId = null, options = {}) => {
        const { reset = true, page: targetPage = 1, pageSize = 500 } = options;
        setLoading(true);
        try {
            const params = {
                page: targetPage,
                pageSize,
                ...(projectId ? { projectId } : {})
            };
            const response = await tasksAPI.getAll(params);

            // Handle both legacy (array) and new (paginated object) response formats
            const data = response.data;
            const fetchedTasksList = Array.isArray(data) ? data : (data.tasks || []);
            const total = data.totalCount || fetchedTasksList.length;
            const more = data.hasMore || false;

            // Normalize and filter invalid items
            const normalizedTasks = fetchedTasksList.map(normalizeEntity).filter(Boolean);

            setTasks(prev => {
                if (reset) return normalizedTasks;

                const taskMap = new Map();
                prev.forEach(t => taskMap.set(t.id, t));
                normalizedTasks.forEach(t => taskMap.set(t.id, t));
                return Array.from(taskMap.values());
            });

            setTotalCount(total);
            setHasMore(more);
            setPage(targetPage);

        } catch (error) {
            console.error('Error fetching tasks:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.title || error.message || 'Görevler yüklenemedi';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = useCallback(async (taskData) => {
        try {
            const response = await tasksAPI.create(taskData);
            const normalized = normalizeEntity(response.data);

            setTasks(prev => {
                // Prevent duplicates but UPDATE if already exists (SignalR race condition)
                if (prev.some(t => t.id === normalized.id)) {
                    console.log(`[useTasks] Task ${normalized.id} exists. Updating with API response. ProjectId: ${normalized.projectId}, Status: ${normalized.status}`);
                    return prev.map(t => t.id === normalized.id ? normalized : t);
                }
                console.log(`[useTasks] Adding new task: ${normalized.id}. ProjectId: ${normalized.projectId}, Status: ${normalized.status}`);
                return [...prev, normalized];
            });
            
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Task creation error:', error);
            toast.error('Görev oluşturulamadı');
            return { success: false, error };
        }
    }, []);

    // Queue for sequential updates per task to prevent race conditions
    const taskQueuesRef = useRef({});

    const processQueue = async (taskId) => {
        const queue = taskQueuesRef.current[taskId];
        if (!queue || queue.length === 0) {
            delete taskQueuesRef.current[taskId];
            return;
        }

        const { data, resolve, reject, previousState } = queue[0];

        try {
            console.log('[useTasks] Sending UPDATE payload:', JSON.stringify(data, null, 2));
            const response = await tasksAPI.update(taskId, data);
            const normalized = normalizeEntity(response.data);

            // Confirm consistency
            setTasks(prev => updateTaskInTree(prev, taskId, normalized));
            resolve({ success: true, data: normalized });
        } catch (error) {
            console.error('Task update error in queue:', error);
            setTasks(previousState);
            const errorMessage = error.response?.data?.message || 'Güncelleme başarısız';
            
            toast.error(`Güncelleme başarısız: ${errorMessage}`);
            resolve({ success: false, handled: true, error });
        } finally {
            // Remove processed item and continue
            queue.shift();
            // Clear interaction guard if queue empty
            if (queue.length === 0) {
                delete lastInteractionByTaskIdRef.current[taskId];
            }
            processQueue(taskId);
        }
    };

    const updateTask = useCallback(async (id, data, optimisticData = null) => {
        const targetId = getId(id);
        if (!targetId) return { success: false, error: 'Invalid ID' };

        // 1. Snapshot previous state (for ALL queued items, we need the state BEFORE this specific optimistic update)
        // Actually, we need the *current* state before we mutate it.
        // Simplification: We snapshot 'prev' inside setTasks, but that's async? 
        // Better: We rely on the fact that if a previous step fails, it rolls back to ITS previous state.
        // So we just need to know the state right now.
        // BUT, 'tasks' state might be stale in closure. 
        // We will use functional state update to capture it.

        // 2. Mark interaction
        lastInteractionByTaskIdRef.current[targetId] = Date.now();

        return new Promise((resolve, reject) => {
            setTasks(prev => {
                const previousState = prev; // Snapshot for this specific mutation

                // 3. Optimistic Update (Use optimisticData if provided, otherwise data)
                const newTasks = updateTaskInTree(prev, targetId, optimisticData || data);

                // 4. Add to Queue (Always use 'data' for API)
                if (!taskQueuesRef.current[targetId]) {
                    taskQueuesRef.current[targetId] = [];
                }

                taskQueuesRef.current[targetId].push({
                    data,
                    resolve,
                    reject,
                    previousState
                });

                // 5. Start Queue if not running
                if (taskQueuesRef.current[targetId].length === 1) {
                    processQueue(targetId);
                }

                return newTasks;
            });
        });
    }, [updateTaskInTree]); // Removed dependencies that might cause loop, processQueue is closure

    const deleteTask = useCallback(async (id) => {
        const targetId = getId(id);
        if (!targetId) return { success: false };

        // 1. Snapshot for undo
        let previousTasks = [];
        let undoTimedOut = true;

        // 2. Optimistic Delete from UI
        setTasks(prev => {
            console.log(`[DEBUG] Optimistic Delete: Removing Task ID ${targetId} from local state`);
            previousTasks = prev;
            const filterTree = (list) => {
                return list.filter(t => t.id !== targetId).map(t => ({
                    ...t,
                    subtasks: t.subtasks ? filterTree(t.subtasks) : []
                }));
            };
            return filterTree(prev);
        });

        // 3. Show Toast with Undo (UX Fix)
        toast.success((t) => (
            <div className="flex items-center gap-4">
                <span>Görev silindi</span>
                <button
                    onClick={() => {
                        undoTimedOut = false;
                        setTasks(previousTasks);
                        toast.dismiss(t.id);
                        toast('Silme işlemi geri alındı', { icon: '↩️' });
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-700 text-xs font-medium rounded border shadow-sm hover:bg-slate-50"
                >
                    Geri Al
                </button>
            </div>
        ), { duration: 5000 });

        // 4. Delayed API Call (5 seconds window)
        // 4. Delayed API Call (5 seconds window)
        setTimeout(async () => {
            if (undoTimedOut) {
                console.log(`[DEBUG] Executing API Delete for Task ID: ${targetId}`);
                try {
                    await tasksAPI.delete(targetId);
                    console.log(`[DEBUG] API Delete Success for Task ID: ${targetId}`);
                } catch (error) {
                    console.error('[DEBUG] Final task deletion error:', error);
                    console.log('[DEBUG] Rolling back optimistic delete...');
                    setTasks(previousTasks);
                    toast.error('Görev sunucudan silinemedi, geri yüklendi');
                }
            } else {
                console.log(`[DEBUG] Delete Undo triggered for Task ID: ${targetId}`);
            }
        }, 5000);

        return { success: true };
    }, []);

    const createSubtask = useCallback(async (taskId, subtaskData) => {
        const targetId = getId(taskId);
        try {
            const response = await subtasksAPI.create(targetId, subtaskData);
            const normalized = normalizeEntity(response.data);

            setTasks(prev => updateTaskInTree(prev, targetId, {
                subtasks: (() => {
                    const existingSubtasks = prev.find(t => t.id === targetId)?.subtasks || [];
                    if (existingSubtasks.some(s => s.id === normalized.id)) return existingSubtasks;
                    return [...existingSubtasks, normalized];
                })()
            }));

            return { success: true, data: normalized };
        } catch (error) {
            console.error('Subtask creation error:', error);
            toast.error('Alt görev oluşturulamadı');
            return { success: false, error };
        }
    }, [updateTaskInTree]);

    const updateSubtask = useCallback(async (subtaskId, data, optimisticData = null) => {
        const targetId = getId(subtaskId);

        // 1. Snapshot for rollback
        let previousTasks = [];

        // 2. Optimistic Update
        setTasks(prev => {
            previousTasks = prev;
            return updateTaskInTree(prev, targetId, optimisticData || data);
        });

        try {
            const response = await subtasksAPI.update(targetId, data);
            const normalized = normalizeEntity(response.data);

            // 3. Confirm with Server Data
            // Note: subtasksAPI check is needed?
            // "We need to find the parent task or just update the subtask in the tree if it's deep"
            // updateTaskInTree handles deep update based on ID
            setTasks(prev => updateTaskInTree(prev, targetId, response.data));

            return { success: true, data: normalized };
        } catch (error) {
            console.error('Subtask update error:', error);
            // 4. Rollback
            setTasks(previousTasks);
            toast.error('Alt görev güncellenemedi');
            return { success: false, error };
        }
    }, [updateTaskInTree]);

    const fetchTaskById = useCallback(async (id) => {
        const targetId = getId(id);
        try {
            const response = await tasksAPI.getById(targetId);
            const normalized = normalizeEntity(response.data);
            setTasks(prev => {
                const existing = findTaskInTree(prev, targetId);
                if (existing) {
                    return updateTaskInTree(prev, targetId, normalized);
                }
                return [normalized, ...prev]; // Prepend for visibility, or append? Prepend matches "latest" usually.
            });
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Error fetching task:', error);
            return { success: false, error };
        }
    }, [updateTaskInTree]);

    const refreshTask = useCallback(async (id) => {
        return await fetchTaskById(id);
    }, [fetchTaskById]);

    const updateTaskStatus = useCallback(async (id, status) => {
        return await updateTask(id, { status });
    }, [updateTask]);

    return useMemo(() => ({
        tasks,
        loading,
        totalCount,
        page,
        hasMore,
        fetchTasks,
        fetchTaskById,
        refreshTask,
        createTask,
        updateTask,
        deleteTask,
        createSubtask,
        updateSubtask,
        updateTaskStatus, // Exposed for MainTable and TaskRow
        setTasks, // Exposed for SignalR updates
        lastInteractionByTaskIdRef // For SignalR: ignore stale TaskUpdated if newer local edit
    }), [tasks, loading, totalCount, page, hasMore, fetchTasks, fetchTaskById, refreshTask, createTask, updateTask, deleteTask, createSubtask, updateSubtask, updateTaskStatus]);
};
