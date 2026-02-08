import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const getBackendUrl = () => {
    if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
    if (process.env.NODE_ENV === 'production') return window.location.origin;
    return 'http://localhost:8080';
};

export const useDashboardData = () => {
    const [data, setData] = useState({ stats: null, tasks: [], totalCount: 0 });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const { isAuthenticated } = useAuth();

    const fetchDashboardData = useCallback(async (targetPage = 1, append = false) => {
        if (!isAuthenticated) return;

        if (append) setLoadingMore(true);
        else setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${getBackendUrl()}/api/tasks/dashboard?page=${targetPage}&pageSize=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { stats, tasks, totalCount, hasMore: more } = response.data;

            setData(prev => ({
                stats: stats || prev.stats,
                tasks: append ? [...prev.tasks, ...(tasks || [])] : (tasks || []),
                totalCount: totalCount || 0
            }));

            setHasMore(more);
            setPage(targetPage);
            setError(null);
        } catch (err) {
            console.error('Dashboard Fetch Error:', err);
            setError(err);
            toast.error('Dashboard verileri yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [isAuthenticated]);

    const loadMore = useCallback(() => {
        if (hasMore && !loadingMore && !loading) {
            fetchDashboardData(page + 1, true);
        }
    }, [hasMore, loadingMore, loading, page, fetchDashboardData]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData(1, false);
        }
    }, [isAuthenticated, fetchDashboardData]);

    return {
        data,
        loading,
        loadingMore,
        error,
        refetch: () => fetchDashboardData(1, false),
        loadMore,
        hasMore
    };
};
