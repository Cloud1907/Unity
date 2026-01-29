import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsAPI, tasksAPI, usersAPI, departmentsAPI, labelsAPI, subtasksAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from '../components/ui/sonner';
import { HubConnectionBuilder } from '@microsoft/signalr';

const DataStateContext = createContext();
const DataActionsContext = createContext();

export const useData = () => {
  const state = useContext(DataStateContext);
  const actions = useContext(DataActionsContext);
  if (!state || !actions) {
    throw new Error('useData must be used within a DataProvider');
  }
  return { ...state, ...actions };
};

export const useDataState = () => {
  const context = useContext(DataStateContext);
  if (!context) {
    throw new Error('useDataState must be used within a DataProvider');
  }
  return context;
};

// Helper for backend URL
const getBackendUrl = () => {
  // Should match API service config
  if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
  return 'http://localhost:8080'; // Fallback to active backend port
};

export const useDataActions = () => {
  const context = useContext(DataActionsContext);
  if (!context) {
    throw new Error('useDataActions must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsAPI.getAll();
      // Normalize: Ensure _id field exists for frontend compatibility
      const normalizedProjects = response.data.map(p => ({
        ...p,
        _id: p._id || p.id || p.Id,
        id: p._id || p.id || p.Id
      }));
      setProjects(normalizedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  const fetchTasks = useCallback(async (projectId = null) => {
    try {
      const params = projectId ? { projectId } : {};
      const response = await tasksAPI.getAll(params);

      // Normalize: Ensure _id field exists for frontend compatibility
      const normalizeTask = (t) => ({
        ...t,
        _id: t._id || t.id || t.Id,
        id: t._id || t.id || t.Id
      });

      setTasks(prevTasks => {
        const normalizedData = response.data.map(normalizeTask);

        if (!projectId) return normalizedData;

        // Create a map of existing tasks by ID
        const taskMap = new Map(prevTasks.map(t => [t._id || t.id, t]));

        // Update or add new tasks from response
        normalizedData.forEach(newTask => {
          taskMap.set(newTask._id || newTask.id, newTask);
        });

        return Array.from(taskMap.values());
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentsAPI.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchLabels = useCallback(async (projectId = null) => {
    try {
      if (projectId) {
        const response = await labelsAPI.getByProject(projectId);
        setLabels(prevLabels => {
          const otherLabels = prevLabels.filter(l => l.projectId !== projectId);
          return [...otherLabels, ...response.data];
        });
      } else {
        const response = await labelsAPI.getAll();
        setLabels(response.data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, []);

  const createLabel = useCallback(async (data) => {
    try {
      const response = await labelsAPI.create(data);
      setLabels(prev => [...prev, response.data]);
      toast.success('Etiket oluşturuldu');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Label creation error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.title || error.message;
      toast.error(errorMessage || 'Etiket oluşturulamadı');
      return { success: false, error };
    }
  }, []);

  const updateLabel = useCallback(async (id, data) => {
    try {
      const response = await labelsAPI.update(id, data);
      setLabels(prev => prev.map(l => l._id === id ? response.data : l));
      toast.success('Etiket güncellendi');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Label update error:', error);
      toast.error('Etiket güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const deleteLabel = useCallback(async (id) => {
    try {
      await labelsAPI.delete(id);
      setLabels(prev => prev.filter(l => l._id !== id));
      toast.success('Etiket silindi');
      return { success: true };
    } catch (error) {
      console.error('Label deletion error:', error);
      toast.error('Etiket silinemedi');
      return { success: false, error };
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchUsers(),
        fetchDepartments()
      ]);
      await fetchLabels();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }, [fetchProjects, fetchTasks, fetchUsers, fetchDepartments, fetchLabels]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();

      // SignalR Setup
      const backendUrl = getBackendUrl();
      // Ensure no trailing slash for signalr hub builder
      const hubUrl = `${backendUrl.replace(/\/+$/, '')}/appHub`;

      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => localStorage.getItem('token')
        })
        .withAutomaticReconnect()
        .build();

      connection.start()
        .then(() => console.log('SignalR Connected!'))
        .catch(err => console.error('SignalR Connection Error: ', err));

      connection.on('TaskCreated', (newTask) => {
        console.log('SignalR: TaskCreated', newTask);
        // Normalize
        const normalized = {
          ...newTask,
          _id: newTask.id || newTask._id,
          id: newTask.id || newTask._id
        };
        setTasks(prev => {
          if (prev.some(t => t.id === normalized.id || t._id === normalized.id)) return prev;
          return [...prev, normalized];
        });
        toast.info(`Yeni görev eklendi: ${normalized.title}`);
      });

      connection.on('TaskUpdated', (updatedTask) => {
        console.log('SignalR: TaskUpdated', updatedTask);
        const normalized = {
          ...updatedTask,
          _id: updatedTask.id || updatedTask._id,
          id: updatedTask.id || updatedTask._id
        };
        setTasks(prev => {
          const existingIndex = prev.findIndex(t => t._id === normalized._id);
          if (existingIndex > -1) {
            const newTasks = [...prev];
            newTasks[existingIndex] = normalized;
            return newTasks;
          }
          // If not found, maybe add it? (e.g. moved from private to public)
          return [...prev, normalized];
        });
      });

      connection.on('TaskDeleted', (taskId) => {
        console.log('SignalR: TaskDeleted', taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId && t._id !== taskId));
      });

      return () => {
        connection.stop();
      };
    }
  }, [isAuthenticated, fetchAllData]);

  // Project operations
  const createProject = useCallback(async (data) => {
    try {
      const response = await projectsAPI.create(data);
      // Normalize
      const normalized = {
        ...response.data,
        _id: response.data._id || response.data.id || response.data.Id,
        id: response.data._id || response.data.id || response.data.Id
      };
      setProjects(prev => [...prev, normalized]);
      toast.success('Proje oluşturuldu!');
      return { success: true, data: normalized };
    } catch (error) {
      toast.error('Proje oluşturulamadı');
      return { success: false, error };
    }
  }, []);

  const updateProject = useCallback(async (id, data) => {
    try {
      const response = await projectsAPI.update(id, data);

      // Handle 204 No Content (response.data is null/empty)
      const updateData = response.data || data;

      const normalized = {
        ...updateData,
        _id: updateData._id || updateData.id || updateData.Id || id,
        id: updateData._id || updateData.id || updateData.Id || id
      };

      setProjects(prev => prev.map(p => (p._id == id || p.id == id) ? { ...p, ...normalized } : p));
      toast.success('Proje güncellendi!');
      return { success: true, data: normalized };
    } catch (error) {
      toast.error('Proje güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    // Attempting to delete project
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p._id != id && p.id != id));
      toast.success('Proje silindi!');
      return { success: true };
    } catch (error) {
      console.error('Delete project error:', error);
      // Error response logged

      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.title || error.message;
      toast.error('HATA: ' + errorMessage); // Prefix to verify code update
      return { success: false, error };
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const response = await projectsAPI.toggleFavorite(id);
      setProjects(prev => prev.map(p => (p._id == id || p.id == id) ? response.data : p));
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Favori durumu değiştirilemedi');
      return { success: false, error };
    }
  }, []);

  // Department operations
  const createDepartment = useCallback(async (data) => {
    try {
      const response = await departmentsAPI.create(data);
      setDepartments(prev => [...prev, response.data]);

      // Auto-update user's workspace list locally for immediate access
      if (user) {
        const newDeptId = response.data.id || response.data._id;
        const currentDepts = user.departments || (user.department ? [user.department] : []);

        // Ensure we don't duplicate
        const alreadyExists = currentDepts.some(d => d === newDeptId || d === response.data.name);
        if (!alreadyExists) {
          const updatedUser = {
            ...user,
            departments: [...currentDepts, newDeptId]
          };
          // Also update local storage via AuthContext
          updateUser(updatedUser);
        }
      }

      toast.success('Çalışma alanı oluşturuldu!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Çalışma alanı oluşturulamadı');
      return { success: false, error };
    }
  }, [user, updateUser]);

  const updateDepartment = useCallback(async (id, data) => {
    try {
      const response = await departmentsAPI.update(id, data);
      setDepartments(prev => prev.map(d => (d._id === id || d.id === id) ? response.data : d));
      toast.success('Çalışma alanı güncellendi!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Çalışma alanı güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const deleteDepartment = useCallback(async (id) => {
    try {
      await departmentsAPI.delete(id);
      setDepartments(prev => prev.filter(d => (d._id !== id && d.id !== id)));
      toast.success('Çalışma alanı silindi!');
      return { success: true };
    } catch (error) {
      toast.error('Çalışma alanı silinemedi');
      return { success: false, error };
    }
  }, []);

  // Task operations
  const createTask = useCallback(async (data) => {
    try {
      const response = await tasksAPI.create(data);
      // Normalize response
      const normalizedTask = {
        ...response.data,
        _id: response.data._id || response.data.id || response.data.Id,
        id: response.data._id || response.data.id || response.data.Id
      };
      setTasks(prev => [...prev, normalizedTask]); // Update with normalized task
      toast.success('Görev oluşturuldu!');
      return { success: true, data: normalizedTask };
    } catch (error) {
      console.error('Task creation failed:', error);
      toast.error('Görev oluşturulamadı');
      return { success: false, error };
    }
  }, []);

  const updateTask = useCallback(async (id, data) => {
    let previousTask = null;
    let taskIndex = -1;

    setTasks(prev => {
      taskIndex = prev.findIndex(t => t._id === id);
      if (taskIndex > -1) {
        previousTask = prev[taskIndex];
        const newTasks = [...prev];
        newTasks[taskIndex] = { ...previousTask, ...data };
        return newTasks;
      }
      return prev;
    });

    try {
      const response = await tasksAPI.update(id, data);
      // Normalize response
      const normalizedTask = {
        ...response.data,
        _id: response.data._id || response.data.id || response.data.Id,
        id: response.data._id || response.data.id || response.data.Id
      };
      setTasks(prev => prev.map(t => t._id === id ? normalizedTask : t));
      return { success: true, data: normalizedTask };
    } catch (error) {
      if (previousTask) {
        setTasks(prev => prev.map(t => t._id === id ? previousTask : t));
      }
      toast.error('Görev güncellenemedi, değişiklikler geri alındı');
      return { success: false, error };
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    const taskToDelete = tasks.find(t => t._id === id);
    if (!taskToDelete) return;

    // Optimistic UI update
    setTasks(prev => prev.filter(t => t._id !== id));

    // Show toast with Undo option
    toast.success('Görev silindi', {
      duration: 5000,
      action: {
        label: 'Geri Al',
        onClick: async () => {
          try {
            // Re-create the task
            const response = await tasksAPI.create(taskToDelete);
            const normalizedTask = {
              ...response.data,
              _id: response.data._id || response.data.id || response.data.Id,
              id: response.data._id || response.data.id || response.data.Id
            };
            setTasks(prev => [...prev, normalizedTask]);
            toast.success('Görev geri yüklendi');
          } catch (e) {
            console.error('Undo failed:', e);
            toast.error('Geri alma işlemi başarısız oldu');
          }
        }
      }
    });

    try {
      await tasksAPI.delete(id);
      return { success: true };
    } catch (error) {
      // Rollback optimistic update on server error
      setTasks(prev => [...prev, taskToDelete]);
      toast.error('Görev silinirken bir hata oluştu');
      return { success: false, error };
    }
  }, [tasks]);


  const updateTaskStatus = useCallback(async (id, status) => {
    let previousTask = null;
    let taskIndex = -1;

    setTasks(prev => {
      taskIndex = prev.findIndex(t => t._id === id);
      if (taskIndex > -1) {
        previousTask = prev[taskIndex];
        const newTasks = [...prev];
        newTasks[taskIndex] = { ...previousTask, status };
        return newTasks;
      }
      return prev;
    });

    try {
      const response = await tasksAPI.updateStatus(id, status);
      // Normalize response
      const normalizedTask = {
        ...response.data,
        _id: response.data._id || response.data.id || response.data.Id,
        id: response.data._id || response.data.id || response.data.Id
      };
      setTasks(prev => prev.map(t => t._id === id ? normalizedTask : t));
      return { success: true, data: normalizedTask };
    } catch (error) {
      if (previousTask) {
        setTasks(prev => prev.map(t => t._id === id ? previousTask : t));
      }
      toast.error('Durum güncellenemedi');
      return { success: false, error };
    }
  }, []);


  const stateValue = React.useMemo(() => ({
    projects,
    tasks,
    users,
    departments,
    labels,
    loading,
    createLabel,
    updateLabel,
    deleteLabel
  }), [projects, tasks, users, departments, labels, loading, createLabel, updateLabel, deleteLabel]);

  const actionsValue = React.useMemo(() => ({
    fetchProjects,
    fetchTasks,
    fetchUsers,
    fetchDepartments,
    fetchLabels,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    createLabel,
    updateLabel,
    deleteLabel,
    refreshData: fetchAllData,
    refreshTask: async (taskId) => {
      try {
        const response = await tasksAPI.getById(taskId);
        setTasks(prev => {
          const existing = prev.find(t => t._id === taskId || t.id === taskId);
          if (existing && JSON.stringify(existing) === JSON.stringify(response.data)) return prev;
          // Update local state map
          const newTasks = prev.map(t => (t._id === taskId || t.id === taskId) ? response.data : t);
          return newTasks;
        });
        return response.data;
      } catch (e) {
        console.error("Failed to refresh task", e);
      }
    },
    updateSubtask: async (subtaskId, data) => {
      try {
        const response = await subtasksAPI.update(subtaskId, data);

        // Optimistic / Local Update
        setTasks(prev => prev.map(task => {
          if (task.subtasks && task.subtasks.find(st => st.id === subtaskId || st._id === subtaskId)) {
            return {
              ...task,
              subtasks: task.subtasks.map(st =>
                (st.id === subtaskId || st._id === subtaskId) ? { ...st, ...response.data } : st
              )
            };
          }
          return task;
        }));
        return { success: true, data: response.data };
      } catch (error) {
        console.error("Subtask update failed:", error); // Inspect network error details
        toast.error('Alt görev güncellenemedi');
        return { success: false, error };
      }
    },
    createSubtask: async (taskId, data) => {
      try {
        const response = await subtasksAPI.create(taskId, data);
        const newSubtask = response.data;

        // Optimistic / Local Update
        setTasks(prev => prev.map(task => {
          if (task._id === taskId || task.id === taskId) {
            const currentSubtasks = task.subtasks || [];
            return {
              ...task,
              subtasks: [...currentSubtasks, newSubtask]
            };
          }
          return task;
        }));

        toast.success("Alt görev eklendi");
        return { success: true, data: newSubtask };
      } catch (error) {
        console.error("Subtask creation failed:", error);
        toast.error("Alt görev oluşturulamadı");
        return { success: false, error };
      }
    }
  }), [
    fetchProjects,
    fetchTasks,
    fetchUsers,
    fetchDepartments,
    fetchLabels,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    createLabel,
    updateLabel,
    deleteLabel,
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
