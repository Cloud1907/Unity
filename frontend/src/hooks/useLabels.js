import { useState, useCallback, useMemo } from 'react';
import { labelsAPI } from '../services/api';
import { toast } from 'sonner';
import { normalizeEntity, getId } from '../utils/entityHelpers';

export const useLabels = () => {
    const [labels, setLabels] = useState([]);

    const fetchLabels = useCallback(async (projectId = null) => {
        try {
            if (projectId) {
                const response = await labelsAPI.getByProject(getId(projectId));
                setLabels(prev => {
                    // Basic non-duplication merge
                    const others = prev.filter(l => l.projectId !== getId(projectId));
                    const data = Array.isArray(response.data) ? response.data : [];
                    const newLabels = data.map(normalizeEntity);
                    return [...others, ...newLabels];
                });
            } else {
                const response = await labelsAPI.getAll();
                const data = Array.isArray(response.data) ? response.data : [];
                setLabels(data.map(normalizeEntity));
            }
        } catch (error) {
            console.error('Error fetching labels:', error);
        }
    }, []);

    const createLabel = useCallback(async (data) => {
        try {
            const response = await labelsAPI.create(data);
            const normalized = normalizeEntity(response.data);
            setLabels(prev => [...prev, normalized]);
            toast.success('Etiket oluşturuldu');
            return { success: true, data: normalized };
        } catch (error) {
            console.error(error);
            toast.error('Etiket oluşturulamadı');
            return { success: false, error };
        }
    }, []);

    const updateLabel = useCallback(async (id, data) => {
        try {
            const response = await labelsAPI.update(id, data);
            const normalized = normalizeEntity(response.data);
            setLabels(prev => prev.map(l => l.id === id ? normalized : l));
            toast.success('Etiket güncellendi');
            return { success: true, data: normalized };
        } catch (error) {
            console.error(error);
            toast.error('Etiket güncellenemedi');
            return { success: false, error };
        }
    }, []);

    const deleteLabel = useCallback(async (id) => {
        try {
            await labelsAPI.delete(id);
            setLabels(prev => prev.filter(l => l.id !== id));
            toast.success('Etiket silindi');
            return { success: true };
        } catch (error) {
            console.error(error);
            toast.error('Etiket silinemedi');
            return { success: false, error };
        }
    }, []);

    return useMemo(() => ({
        labels,
        fetchLabels,
        createLabel,
        updateLabel,
        deleteLabel
    }), [labels, fetchLabels, createLabel, updateLabel, deleteLabel]);
};
