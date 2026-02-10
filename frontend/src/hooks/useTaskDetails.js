import { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import api, { auditAPI, commentsAPI, subtasksAPI } from '../services/api';
import { normalizeEntity } from '../utils/entityHelpers';
import { filterProjectUsers } from '../utils/userHelper';

export const useTaskDetails = (initialTask, isOpen, onClose, initialSection = 'subtasks') => {
    const { tasks, updateTask, deleteTask, createSubtask, updateSubtask, refreshTask, users, projects } = useData();
    const { user: currentUser } = useAuth();

    // 1. Single Source of Truth: Derived Task from Global Context
    // We normalize immediately to ensure UI gets clean data.
    const task = useMemo(() => {
        const found = tasks.find(t => t.id === initialTask.id);
        const source = found || initialTask;
        return normalizeEntity(source);
    }, [tasks, initialTask]);

    // 2. Derived Sub-states (No Effect Sync needed!)
    const subtasks = task.subtasks || [];
    const comments = task.comments || [];
    const attachments = task.attachments || [];

    // 3. UI Local State (Navigation, Loading, etc.)
    const [activeSection, setActiveSection] = useState(initialSection);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Reload task data when modal opens (Freshness check)
    useEffect(() => {
        if (isOpen && task.id) {
            refreshTask(task.id);
        }
    }, [isOpen, task.id, refreshTask]);

    // Load activity logs if section is active
    useEffect(() => {
        if (isOpen && activeSection === 'activity' && task.id) {
            loadActivityLogs();
        }
    }, [activeSection, task.id, isOpen, task.status, task.priority, task.startDate, task.dueDate]);

    const loadActivityLogs = async () => {
        setLoadingLogs(true);
        try {
            const response = await auditAPI.getTaskLogs(task.id);
            setActivityLogs(response.data);
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Derived user data
    const filteredUsers = useMemo(() => {
        if (!task.projectId) return users;
        const currentProject = projects.find(p => p.id === task.projectId);
        return filterProjectUsers(currentProject, users);
    }, [users, task.projectId, projects]);

    const workspaceId = useMemo(() => {
        const currentProject = projects.find(p => p.id === task.projectId);
        return currentProject?.departmentId || null;
    }, [task.projectId, projects]);


    // Handlers - Directly update Global State via Context

    const handleTitleChange = (newTitle) => {
        // Optimistic update via Context
        updateTask(task.id, { title: newTitle });
    };

    const handleUpdate = async (id, data, optimisticData = null) => {
        return await updateTask(id, data, optimisticData);
    };

    const handleAddSubtask = async (title, clearInput) => {
        if (!title.trim()) return;

        // Context's createSubtask handles optimistic update
        const result = await createSubtask(task.id, {
            title: title,
            isCompleted: false
        });

        if (result.success) {
            refreshTask(task.id); // Ensure full sync (counts etc.)
            clearInput();
        }
    };

    const handleAddComment = async (text, clearInput) => {
        if (!text.trim()) return;

        try {
            // Optimistic UI for comments is harder without Context support,
            // but we can rely on refreshTask for now as it's fast enough or
            // add a temporary local "optimisticComments" state if needed.
            // For now, let's trust refreshTask frequency.
            await commentsAPI.create(task.id, { text });
            clearInput();
            await refreshTask(task.id);
        } catch (error) {
            console.error(error);
            toast.error('Yorum eklenemedi');
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = response.data;
            const newAttachment = {
                id: Date.now(),
                name: file.name,
                url: data.url,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };

            const newAttachments = [...attachments, newAttachment];

            const attachmentPayload = newAttachments.map(att => ({
                name: att.name,
                url: att.url,
                type: att.type || 'unknown',
                size: att.size || 0
            }));

            await api.patch(`/tasks/${task.id}`, { attachments: attachmentPayload });
            await refreshTask(task.id);
            toast.success('Dosya başarıyla yüklendi');
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Dosya yüklenemedi');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAttachment = async (fileId) => {
        try {
            await api.delete(`/tasks/attachments/${fileId}`);
            // Optimistic deletion could be: updateTask(task.id, { attachments: attachments.filter(...) })
            // But API patch logic for attachments is replace-all? checking above... yes.
            // Safe to just refresh.
            await refreshTask(task.id);
            toast.success('Dosya silindi');
        } catch (error) {
            console.error(error);
            toast.error('Dosya silinemedi');
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await api.delete(`/tasks/comments/${commentId}`);
            await refreshTask(task.id);
            toast.success('Yorum silindi');
        } catch (e) {
            console.error(e);
            toast.error('Silme başarısız');
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        // Optimistic delete handled by Context?
        // Context has `deleteTask` but not `deleteSubtask` explicitly exposed?
        // No, `deleteTask` is for main tasks.
        // We can manually filter subtasks if we want.
        // But for now, refreshTask is fine.
        try {
            await api.delete(`/tasks/subtasks/${subtaskId}`);
            await refreshTask(task.id);
        } catch (error) {
            console.error(error);
            toast.error('Alt görev silinemedi');
        }
    };

    const handleReorderSubtasks = async (items) => {
        try {
            await subtasksAPI.reorder({ items });
            // refreshTask will happen via SignalR or we can trigger it manually
            // Logic in TasksController already broadcasts TaskUpdated
        } catch (error) {
            console.error(error);
            toast.error('Sıralama güncellenemedi');
        }
    };

    // No-op setters to maintain compatibility
    const noOp = () => { console.warn("Setter called on derived state - ignored."); };

    return {
        task,
        taskData: task, // Alias for compatibility
        setTaskData: noOp,
        subtasks,
        setSubtasks: noOp,
        comments,
        setComments: noOp, // Comments are read-only from task
        attachments,
        activeSection,
        setActiveSection,
        activityLogs,
        loadingLogs,
        isUploading,
        handleTitleChange,
        handleUpdate,
        handleAddSubtask,
        updateSubtask,
        handleAddComment,
        handleFileUpload,
        handleDeleteAttachment,
        handleDeleteComment,
        handleDeleteSubtask,
        handleReorderSubtasks,
        deleteTask,
        currentUser,
        users,
        filteredUsers,
        workspaceId,
        projects
    };
};
