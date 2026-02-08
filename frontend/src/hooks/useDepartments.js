import { useState, useCallback, useMemo } from 'react';
import { departmentsAPI } from '../services/api';
import { normalizeEntity } from '../utils/entityHelpers';

export const useDepartments = () => {
    const [departments, setDepartments] = useState([]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentsAPI.getAll();
            const data = Array.isArray(response.data) ? response.data : [];
            const normalized = data.map(normalizeEntity);
            setDepartments(normalized);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    }, []);

    const createDepartment = useCallback(async (data) => {
        try {
            const response = await departmentsAPI.create(data);
            const normalized = normalizeEntity(response.data);
            setDepartments(prev => {
                if (prev.some(d => d.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Error creating department:', error);
            return { success: false, error };
        }
    }, []);

    const updateDepartment = useCallback(async (id, data) => {
        try {
            const response = await departmentsAPI.update(id, data);
            const normalized = normalizeEntity(response.data);
            setDepartments(prev => prev.map(d => d.id === id ? normalized : d));
            return { success: true, data: normalized };
        } catch (error) {
            console.error('Error updating department:', error);
            return { success: false, error };
        }
    }, []);

    const deleteDepartment = useCallback(async (id) => {
        try {
            await departmentsAPI.delete(id);
            setDepartments(prev => prev.filter(d => d.id !== id));
            return { success: true };
        } catch (error) {
            console.error('Error deleting department:', error);
            return { success: false, error };
        }
    }, []);

    return useMemo(() => ({
        departments,
        setDepartments,
        fetchDepartments,
        createDepartment,
        updateDepartment,
        deleteDepartment
    }), [departments, fetchDepartments, createDepartment, updateDepartment, deleteDepartment]);
};
