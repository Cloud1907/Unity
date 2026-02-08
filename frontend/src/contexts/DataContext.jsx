import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useDepartments } from '../hooks/useDepartments';
import { useSignalR } from '../hooks/useSignalR';
import { useLabels } from '../hooks/useLabels';
import { normalizeEntity, getId, isAssigned } from '../utils/entityHelpers';
import { toast } from 'sonner';

// Create Context
// Create Two Separate Contexts
const DataStateContext = createContext();
const DataActionsContext = createContext();

// Helper to determine Backend URL
const getBackendUrl = () => {
  if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
  if (process.env.NODE_ENV === 'production') return window.location.origin;
  return 'http://localhost:8080';
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // -- 1. Compose Hooks --
  const projectsHook = useProjects();
  const tasksHook = useTasks();
  const usersHook = useUsers();
  const departmentsHook = useDepartments();
  const labelsHook = useLabels();

  // -- 3. SignalR Integration (pass ref so SignalR ignores stale updates after optimistic edits) --
  const hubConnection = useSignalR(
    isAuthenticated,
    tasksHook.setTasks,
    projectsHook.setProjects,
    departmentsHook.setDepartments,
    labelsHook.setLabels,
    getBackendUrl,
    tasksHook.lastInteractionByTaskIdRef
  );

  const [isInitialized, setIsInitialized] = React.useState(false);

  // -- 4. Master Load Function --
  // PERFORMANCE FIX: Removed tasksHook.fetchTasks() from here
  // Tasks are now fetched per-board in MainTable/KanbanView, not globally
  // This prevents fetching ALL tasks from ALL projects on app load
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;

    await Promise.all([
      projectsHook.fetchProjects(),
      // tasksHook.fetchTasks() - REMOVED: Caused ALL tasks to load globally
      usersHook.fetchUsers(), // RESTORED: Required for resolving User IDs to Names/Avatars globally
      departmentsHook.fetchDepartments()
    ]);

    await labelsHook.fetchLabels();
    setIsInitialized(true);
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.log('--- GLOBAL DATA SYNC COMPLETED ---');
      }
    }
  }, [isAuthenticated, projectsHook.fetchProjects, usersHook.fetchUsers, departmentsHook.fetchDepartments, labelsHook.fetchLabels]);

  // Initial Load
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // -- 4b. Specialized Action Wrappers --
  const { refreshUser } = useAuth();

  const handleCreateDepartment = useCallback(async (data) => {
    const result = await departmentsHook.createDepartment(data);
    if (result.success) {
      // Sync user definitions for department mapping
      await usersHook.fetchUsers();
      // Sync user profile immediately so permissions are updated
      await refreshUser();
      // If was a quick project creation included, refresh projects too
      if (data.initialProject) {
        await projectsHook.fetchProjects();
      }
    }
    return result;
  }, [departmentsHook.createDepartment, refreshUser]);

  const handleCreateProject = useCallback(async (data) => {
    const result = await projectsHook.createProject(data);
    if (result.success) {
      // Refresh user list and profile to ensure permissions and context are synced
      await Promise.all([
        usersHook.fetchUsers(),
        refreshUser()
      ]);
    }
    return result;
  }, [projectsHook.createProject, refreshUser]);

  // -- 5. Split Memoization --

  // STATE: This changes frequently
  const stateValue = React.useMemo(() => ({
    projects: projectsHook.projects,
    tasks: tasksHook.tasks,
    tasksTotalCount: tasksHook.totalCount,
    tasksPage: tasksHook.page,
    tasksHasMore: tasksHook.hasMore,
    users: usersHook.users,
    departments: departmentsHook.departments,
    labels: labelsHook.labels,
    loading: projectsHook.loading || tasksHook.loading,
    isInitialized
  }), [
    projectsHook.projects, tasksHook.tasks, tasksHook.totalCount, tasksHook.page, tasksHook.hasMore, usersHook.users,
    departmentsHook.departments, labelsHook.labels,
    projectsHook.loading, tasksHook.loading, isInitialized
  ]);

  // ACTIONS: This stays stable!
  const actionsValue = React.useMemo(() => ({
    // Projects
    fetchProjects: projectsHook.fetchProjects,
    createProject: handleCreateProject,
    updateProject: projectsHook.updateProject,
    deleteProject: projectsHook.deleteProject,
    toggleFavorite: projectsHook.toggleFavorite,

    // Tasks
    fetchTasks: tasksHook.fetchTasks,
    loadMoreTasks: (projectId) => tasksHook.fetchTasks(projectId, { reset: false, page: tasksHook.page + 1 }),
    createTask: tasksHook.createTask,
    updateTask: tasksHook.updateTask,
    deleteTask: tasksHook.deleteTask,
    createSubtask: tasksHook.createSubtask,
    refreshTask: tasksHook.refreshTask,
    updateSubtask: tasksHook.updateSubtask,
    updateTaskStatus: tasksHook.updateTaskStatus,

    // Hub
    joinProjectGroup: hubConnection?.joinProjectGroup,
    leaveProjectGroup: hubConnection?.leaveProjectGroup,

    // Org
    fetchUsers: usersHook.fetchUsers,
    fetchWorkspaceUsers: usersHook.fetchWorkspaceUsers,
    getUsersForWorkspace: usersHook.getUsersForWorkspace,
    fetchDepartments: departmentsHook.fetchDepartments,
    createDepartment: handleCreateDepartment,
    updateDepartment: departmentsHook.updateDepartment,
    deleteDepartment: departmentsHook.deleteDepartment,

    // Labels
    fetchLabels: labelsHook.fetchLabels,
    createLabel: labelsHook.createLabel,
    updateLabel: labelsHook.updateLabel,
    deleteLabel: labelsHook.deleteLabel,

    // Core
    fetchAllData,
    getBackendUrl
  }), [
    projectsHook.fetchProjects, handleCreateProject, projectsHook.updateProject, projectsHook.deleteProject, projectsHook.toggleFavorite,
    tasksHook.fetchTasks, tasksHook.createTask, tasksHook.updateTask, tasksHook.deleteTask, tasksHook.createSubtask, tasksHook.refreshTask, tasksHook.updateSubtask, tasksHook.updateTaskStatus,
    hubConnection?.joinProjectGroup, hubConnection?.leaveProjectGroup,
    usersHook.fetchUsers, departmentsHook.fetchDepartments, handleCreateDepartment, departmentsHook.updateDepartment, departmentsHook.deleteDepartment,
    labelsHook.fetchLabels, labelsHook.createLabel, labelsHook.updateLabel, labelsHook.deleteLabel,
    fetchAllData
  ]);

  return (
    <DataStateContext.Provider value={stateValue}>
      <DataActionsContext.Provider value={actionsValue}>
        {children}
      </DataActionsContext.Provider>
    </DataStateContext.Provider>
  );
};

// Hook to access state only
export const useDataState = () => {
  const context = useContext(DataStateContext);
  if (context === undefined) throw new Error('useDataState must be used within DataProvider');
  return context;
};

// Hook to access actions only (Stable)
export const useDataActions = () => {
  const context = useContext(DataActionsContext);
  if (context === undefined) throw new Error('useDataActions must be used within DataProvider');
  return context;
};

// Combined Hook (Legacy support)
export const useData = () => {
  return { ...useDataState(), ...useDataActions() };
};
