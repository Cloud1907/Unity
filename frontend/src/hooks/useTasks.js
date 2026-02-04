import { useState, useCallback, useMemo } from 'react';
import { tasksAPI, subtasksAPI } from '../services/api';
import { normalizeEntity, getId } from '../utils/entityHelpers';
import { updateTaskInTree } from '../utils/taskHelpers';
import { toast } from 'react-hot-toast';

export const useTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);


    const fetchTasks = useCallback(async (projectId = null) => {
        setLoading(true);
        try {
            const params = projectId ? { projectId } : {};
            const response = await tasksAPI.getAll(params);

            // Normalize and filter invalid items
            const normalizedTasks = response.data.map(normalizeEntity).filter(Boolean);

            setTasks(prev => {
                const newData = !projectId ? normalizedTasks : (() => {
                    const taskMap = new Map();
                    prev.forEach(t => taskMap.set(t.id, t));
                    normalizedTasks.forEach(t => taskMap.set(t.id, t));
                    return Array.from(taskMap.values());
                })();

                // Identity check: Avoid re-render if data is deep-equal (string conversion for speed/simplicity here)
                if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;

                return newData;
            });

        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Görevler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = useCallback(async (taskData) => {
        try {
            const response = await tasksAPI.create(taskData);
            const normalized = normalizeEntity(response.data);

            setTasks(prev => {
                if (prev.some(t => t.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
            // Toast handled by component or context generally, but OK here
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Task creation error:', error);
            toast.error('Görev oluşturulamadı');
            return { success: false, error };
        }
    }, []);

    const updateTask = useCallback(async (id, data) => {
        const targetId = getId(id);
        if (!targetId) return { success: false, error: 'Invalid ID' };

        // 1. Snapshot previous state for rollback
        let previousTasks = [];

        // 2. Optimistic Update
        setTasks(prev => {
            previousTasks = prev; // Capture current state
            return updateTaskInTree(prev, targetId, data);
        });

        try {
            const response = await tasksAPI.update(targetId, data);
            const normalized = normalizeEntity(response.data);

            // 3. Confirm with Server Data (Optional, but good for consistency)
            // Ideally optimistic state is close enough, but server might normalize fields
            setTasks(prev => updateTaskInTree(prev, targetId, response.data));

            return { success: true, data: normalized };
        } catch (error) {
            console.error('Task update error:', error);
            // 4. Rollback on Error
            setTasks(previousTasks);
            toast.error('Görev güncellenemedi');
            return { success: false, error };
        }
    }, [updateTaskInTree]);

    const deleteTask = useCallback(async (id) => {
        const targetId = getId(id);
        if (!targetId) return { success: false };

        // 1. Snapshot for undo
        let previousTasks = [];
        let undoTimedOut = true;

        // 2. Optimistic Delete from UI
        setTasks(prev => {
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
        setTimeout(async () => {
            if (undoTimedOut) {
                try {
                    await tasksAPI.delete(targetId);
                } catch (error) {
                    console.error('Final task deletion error:', error);
                    setTasks(previousTasks);
                    toast.error('Görev sunucudan silinemedi, geri yüklendi');
                }
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

    const updateSubtask = useCallback(async (subtaskId, data) => {
        const targetId = getId(subtaskId);

        // 1. Snapshot for rollback
        let previousTasks = [];

        // 2. Optimistic Update
        setTasks(prev => {
            previousTasks = prev;
            return updateTaskInTree(prev, targetId, data);
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
            setTasks(prev => updateTaskInTree(prev, targetId, normalized));
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
        fetchTasks,
        fetchTaskById,
        refreshTask,
        createTask,
        updateTask,
        deleteTask,
        createSubtask,
        updateSubtask,
        updateTaskStatus, // Exposed for MainTable and TaskRow
        setTasks // Exposed for SignalR updates
    }), [tasks, loading, fetchTasks, fetchTaskById, refreshTask, createTask, updateTask, deleteTask, createSubtask, updateSubtask, updateTaskStatus]);
};
