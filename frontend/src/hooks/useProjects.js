import { useState, useCallback, useMemo } from 'react';
import { projectsAPI } from '../services/api';
import { normalizeEntity, getId } from '../utils/entityHelpers';
import { toast } from 'sonner';

export const useProjects = (setTasks) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const response = await projectsAPI.getAll();
            const data = Array.isArray(response.data) ? response.data : [];
            const normalized = data.map(normalizeEntity).filter(Boolean);
            setProjects(normalized);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Projeler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    const createProject = useCallback(async (projectData) => {
        try {
            const response = await projectsAPI.create(projectData);
            const normalized = normalizeEntity(response.data);

            // Fix: Check for duplicates (SignalR race condition)
            setProjects(prev => {
                if (prev.some(p => p.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
            toast.success('Proje oluşturuldu');
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Project creation error:', error);
            toast.error('Proje oluşturulamadı');
            return { success: false, error };
        }
    }, []);

    const updateProject = useCallback(async (id, data) => {
        try {
            const response = await projectsAPI.update(id, data);
            const normalized = normalizeEntity(response.data);

            setProjects(prev => prev.map(p => p.id === getId(id) ? normalized : p));

            // Update local task state if project details changed (optional, but good for consistency)
            // if (setTasks) ... logic removed to decouple

            toast.success('Proje güncellendi');
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Project update error:', error);
            toast.error('Proje güncellenemedi');
            return { success: false, error };
        }
    }, []);

    const deleteProject = useCallback(async (id) => {
        try {


            await projectsAPI.delete(id);
            setProjects(prev => prev.filter(p => p.id !== getId(id)));

            // Also remove tasks for this project if we had access to tasks state...
            // Ideally handled by parent or re-fetch
            if (setTasks) {
                setTasks(prev => prev.filter(t => t.projectId !== getId(id)));
            }

            toast.success('Proje silindi');
            return { success: true };
        } catch (error) {
            console.error('Project deletion error:', error);
            toast.error('Proje silinemedi');
            return { success: false, error };
        }
    }, [setTasks]);

    const toggleFavorite = useCallback(async (projectId) => {
        try {
            // Optimistic update
            setProjects(prev => prev.map(p =>
                p.id === getId(projectId) ? { ...p, isFavorite: !p.isFavorite } : p
            ));

            await projectsAPI.toggleFavorite(getId(projectId));
            // No toast needed for simple toggle usually, or subtle one
        } catch (error) {
            console.error('Favorite toggle error:', error);
            toast.error('Favori güncellenemedi');
            // Revert
            setProjects(prev => prev.map(p =>
                p.id === getId(projectId) ? { ...p, isFavorite: !p.isFavorite } : p
            ));
        }
    }, []);

    return useMemo(() => ({
        projects,
        setProjects,
        loading,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        toggleFavorite
    }), [projects, loading, fetchProjects, createProject, updateProject, deleteProject, toggleFavorite]);
};
