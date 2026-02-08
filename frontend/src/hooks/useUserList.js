import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const getBackendUrl = () => {
    if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
    if (process.env.NODE_ENV === 'production') return window.location.origin;
    return 'http://localhost:8080';
};

/**
 * useUserList Hook
 * 
 * Centralized logic for fetching users.
 * 
 * @param {Object} options
 * @param {number|string} [options.workspaceId] - If provided, restricts list to this workspace.
 * @param {boolean} [options.global] - If true, fetches ALL users (Admin/Creation context).
 * @param {boolean} [options.enabled] - Defaults to true. Set false to defer fetching.
 */
export const useUserList = ({ workspaceId, global = false, enabled = true } = {}) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cache key to prevent redundant redundant calls for same params
    const cacheKey = useRef('');

    useEffect(() => {
        if (!enabled) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                let url = `${getBackendUrl()}/api/users`;
                const params = new URLSearchParams();

                if (global) {
                    params.append('mode', 'global');
                } else if (workspaceId) {
                    params.append('workspace_id', workspaceId);
                }

                const currentKey = params.toString();
                if (cacheKey.current === currentKey && users.length > 0) {
                    // Simple duplicate check if nothing changed? 
                    // Better just let it fetch to be fresh, or implement real caching.
                    // For now, let's fetch to ensure freshness.
                }
                cacheKey.current = currentKey;

                const response = await axios.get(url, {
                    params,
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Normalize response: handle array or object with data/users property
                const data = response.data;
                const userList = Array.isArray(data) ? data : (data.users || data.data || []);
                setUsers(userList);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError(err);
                toast.error('Kullanıcı listesi alınamadı.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [workspaceId, global, enabled]);

    return { users, loading, error };
};
