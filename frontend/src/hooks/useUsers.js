import { useState, useCallback, useMemo, useRef } from 'react';
import { usersAPI } from '../services/api';
import { normalizeEntity } from '../utils/entityHelpers';

export const useUsers = () => {
    const [users, setUsers] = useState([]); // Global/Shared list (Legacy + Default)
    const [workspaceUsers, setWorkspaceUsers] = useState({}); // Cache: { workspaceId: [users] }
    const [loading, setLoading] = useState(false);

    // Fetch default list (Shared context)
    const fetchUsers = useCallback(async (departmentId = null) => {
        setLoading(true);
        try {
            // Note: departmentId param here is legacy. 
            // We request a large page size to ensure we get most users for avatar metadata resolution
            // until we move to a true on-demand user metadata service.
            const response = await usersAPI.getAll(departmentId, null, null, 1, 1000);

            // Handle new response structure
            const data = Array.isArray(response.data) ? response.data : (response.data.users || []);
            const normalized = data.map(normalizeEntity);
            setUsers(normalized);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch strict list for a specific workspace
    const fetchWorkspaceUsers = useCallback(async (workspaceId) => {
        if (!workspaceId) return;

        try {
            const response = await usersAPI.getAll(null, workspaceId, null, 1, 1000);
            const data = Array.isArray(response.data) ? response.data : (response.data.users || []);
            const normalized = data.map(normalizeEntity);

            setWorkspaceUsers(prev => ({
                ...prev,
                [workspaceId]: normalized
            }));
            return normalized;
        } catch (error) {
            console.error(`Error fetching users for workspace ${workspaceId}:`, error);
            return [];
        }
    }, []);

    // Helper to get users synchronously if loaded, or trigger load
    const getUsersForWorkspace = useCallback((workspaceId) => {
        return workspaceUsers[workspaceId] || [];
    }, [workspaceUsers]);

    return useMemo(() => ({
        users,
        fetchUsers,
        workspaceUsers,
        fetchWorkspaceUsers,
        getUsersForWorkspace,
        loading
    }), [users, fetchUsers, workspaceUsers, fetchWorkspaceUsers, getUsersForWorkspace, loading]);
};
