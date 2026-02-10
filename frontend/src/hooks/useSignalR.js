import { useRef, useEffect, useCallback, useMemo } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { normalizeEntity, getId } from '../utils/entityHelpers';
import { updateTaskInTree } from '../utils/taskHelpers';
import { toast } from 'sonner';

export const useSignalR = (isAuthenticated, setTasks, setProjects, setDepartments, setLabels, getBackendUrl, lastInteractionByTaskIdRef = { current: {} }) => {
    const connectionRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const backendUrl = getBackendUrl();
        const hubUrl = `${backendUrl.replace(/\/+$/, '')}/appHub`;

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => localStorage.getItem('token')
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        const startConnection = async () => {
            try {
                await connection.start();
                console.log('SignalR Connected!');
            } catch (err) {
                console.error('SignalR Connection Error: ', err);
            }
        };

        startConnection();

        // Event Handlers
        connection.on('TaskCreated', (newTask) => {
            const normalized = normalizeEntity(newTask);
            setTasks(prev => {
                if (prev.some(t => t.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
            toast.info(`Yeni görev eklendi: ${normalized.title}`);
        });

        connection.on('TaskUpdated', (updatedTask) => {
            const normalized = normalizeEntity(updatedTask);
            console.log('[SignalR] TaskUpdated received:', normalized.title, normalized.id);

            const taskId = normalized.id;
            const lastLocal = lastInteractionByTaskIdRef?.current?.[taskId];
            const incomingTime = normalized.updatedAt ? new Date(normalized.updatedAt).getTime() : 0;

            // DEBUG: Log timing
            // console.log(`[SignalR] Time check - Local: ${lastLocal}, Incoming: ${incomingTime}, Diff: ${incomingTime - lastLocal}`);

            // STALE CHECK DISABLED FOR DEBUGGING
            // if (lastLocal && incomingTime < lastLocal) {
            //    console.warn('[SignalR] Ignoring stale update');
            //    return; 
            // }

            setTasks(prev => {
                const updated = updateTaskInTree(prev, taskId, normalized);
                return updated;
            });

            // Optional: Toast for confirmation (Can be removed later)
            // toast.info(`Görev güncellendi: ${normalized.title}`);
        });

        connection.on('TaskDeleted', (taskId) => {
            const targetId = getId(taskId);
            setTasks(prev => prev.filter(t => t.id !== targetId));
            toast.info('Bir görev silindi');
        });

        // Label Events
        connection.on('LabelCreated', (newLabel) => {
            const normalized = normalizeEntity(newLabel);
            setLabels(prev => {
                if (prev.some(l => l.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
        });

        connection.on('LabelUpdated', (updatedLabel) => {
            const normalized = normalizeEntity(updatedLabel);
            setLabels(prev => prev.map(l => l.id === normalized.id ? normalized : l));
        });

        connection.on('LabelDeleted', (labelId) => {
            const targetId = getId(labelId);
            setLabels(prev => prev.filter(l => l.id !== targetId));
        });

        // New Workspace/Project Events
        connection.on('ProjectCreated', (newProject) => {
            const normalized = normalizeEntity(newProject);
            setProjects(prev => {
                if (prev.some(p => p.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
            toast.info(`Yeni proje: ${normalized.name}`);
        });

        connection.on('WorkspaceCreated', (newWorkspace) => {
            const normalized = normalizeEntity(newWorkspace);
            setDepartments(prev => {
                if (prev.some(d => d.id === normalized.id)) return prev;
                return [...prev, normalized];
            });
            toast.info(`Yeni çalışma alanı: ${normalized.name}`);
        });

        return () => {
            connection.stop();
        };
    }, [isAuthenticated, getBackendUrl, setTasks, setProjects, setDepartments, lastInteractionByTaskIdRef]);

    const joinProjectGroup = useCallback(async (projectId) => {
        if (!connectionRef.current || connectionRef.current.state !== 'Connected') {
            console.warn('SignalR: Cannot join project group yet (not connected).');
            return;
        }
        const targetId = getId(projectId);
        try {
            await connectionRef.current.invoke('JoinProjectGroup', targetId.toString());
            console.log(`Joined project group: ${targetId}`);
        } catch (err) {
            console.error('JoinProjectGroup Error: ', err);
        }
    }, []);

    const leaveProjectGroup = useCallback(async (projectId) => {
        if (!connectionRef.current || connectionRef.current.state !== 'Connected') return;

        const targetId = getId(projectId);
        try {
            await connectionRef.current.invoke('LeaveProjectGroup', targetId.toString());
            console.log(`Left project group: ${targetId}`);
        } catch (err) {
            console.error('LeaveProjectGroup Error: ', err);
        }
    }, []);

    return useMemo(() => ({
        connection: connectionRef.current,
        joinProjectGroup,
        leaveProjectGroup
    }), [joinProjectGroup, leaveProjectGroup]);
};
