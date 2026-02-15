import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for Optimistic UI updates with Rollback and Shake animation.
 * 
 * @param {any} initialValue - The value from props (Server State)
 * @param {Function} onUpdate - Async function to call for update (API)
 * @param {Object} options - { debounceMs: number }
 */
export const useOptimisticUpdate = (initialValue, onUpdate, options = {}) => {
    const [localValue, setLocalValue] = useState(initialValue);
    const [status, setStatus] = useState('idle'); // 'idle' | 'pending' | 'success' | 'error'
    const lastInteractionRef = useRef(0);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Sync with External State (Server) ONLY if user is idle
    useEffect(() => {
        const timeSinceInteraction = Date.now() - lastInteractionRef.current;
        // If user hasn't interacted for 2 seconds, sync with prop
        if (timeSinceInteraction > 2000 && status !== 'pending') {
            setLocalValue(initialValue);
        }
    }, [initialValue, status]);

    const update = useCallback(async (newValue) => {
        // 1. Optimistic Update
        const previousValue = localValue;
        setLocalValue(newValue);
        setStatus('pending');
        lastInteractionRef.current = Date.now();

        try {
            // 2. Call API (Queue managed by useTasks)
            const result = await onUpdate(newValue);

            // FIX: If API suppresses error (resolved with success: false), we must manually trigger rollback
            if (result && result.success === false) {
                const error = result.error || new Error('Update failed');
                if (result.handled) error.handled = true;
                throw error;
            }

            if (isMounted.current) {
                setStatus('success');
                // Optional: Flash success?
                setTimeout(() => setStatus('idle'), 1000);
            }
        } catch (error) {
            console.error("Optimistic Update Failed:", error);
            if (isMounted.current) {
                // 3. Rollback & Shake
                setStatus('error');
                setLocalValue(previousValue);
                if (!error.handled) {
                    toast.error('Değişiklik kaydedilemedi');
                }

                // Clear error status after animation
                setTimeout(() => setStatus('idle'), 600);
            }
        }
    }, [localValue, onUpdate]);

    return {
        value: localValue,
        setValue: setLocalValue, // For controlled inputs before commit
        update, // For commit (onBlur, onChange)
        status,
        isPending: status === 'pending',
        isError: status === 'error'
    };
};
