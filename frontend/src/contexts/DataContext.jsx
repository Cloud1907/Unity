import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsAPI, tasksAPI, usersAPI, departmentsAPI, labelsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from '../components/ui/sonner';

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
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  const fetchTasks = useCallback(async (projectId = null) => {
    try {
      const params = projectId ? { projectId } : {};
      const response = await tasksAPI.getAll(params);

      setTasks(prevTasks => {
        if (!projectId) return response.data;

        // Create a map of existing tasks by ID
        const taskMap = new Map(prevTasks.map(t => [t._id || t.id, t]));

        // Update or add new tasks from response
        response.data.forEach(newTask => {
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
    }
  }, [isAuthenticated, fetchAllData]);

  // Project operations
  const createProject = useCallback(async (data) => {
    try {
      const response = await projectsAPI.create(data);
      setProjects(prev => [...prev, response.data]);
      toast.success('Proje oluşturuldu!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Proje oluşturulamadı');
      return { success: false, error };
    }
  }, []);

  const updateProject = useCallback(async (id, data) => {
    try {
      const response = await projectsAPI.update(id, data);
      setProjects(prev => prev.map(p => p._id === id ? response.data : p));
      toast.success('Proje güncellendi!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Proje güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    console.log('Attempting to delete project:', id);
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p._id != id && p.id != id));
      toast.success('Proje silindi!');
      return { success: true };
    } catch (error) {
      console.error('Delete project error:', error);
      console.log('Error Response:', error.response);
      console.log('Error Data:', error.response?.data);

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
      setTasks(prev => [...prev, response.data]);
      toast.success('Görev oluşturuldu!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Task creation failed:', error);
      toast.error('Görev oluşturulamadı');
      return { success: false, error };
    }
  }, []);

  const updateTask = useCallback(async (id, data) => {
    let previousTask = null;
    setTasks(prev => {
      const task = prev.find(t => t._id === id);
      if (task) previousTask = task;
      return prev.map(t => t._id === id ? { ...t, ...data } : t);
    });

    try {
      const response = await tasksAPI.update(id, data);
      setTasks(prev => prev.map(t => t._id === id ? response.data : t));
      toast.success('Değişiklikler kaydedildi');
      return { success: true, data: response.data };
    } catch (error) {
      if (previousTask) {
        setTasks(prev => prev.map(t => t._id === id ? previousTask : t));
      }
      toast.error('Görev güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t._id !== id));

    try {
      await tasksAPI.delete(id);
      toast.success('Görev silindi!');
      return { success: true };
    } catch (error) {
      setTasks(previousTasks);
      toast.error('Görev silinemedi');
      return { success: false, error };
    }
  }, [tasks]);

  const updateTaskStatus = useCallback(async (id, status) => {
    let previousTask = null;
    setTasks(prev => {
      const task = prev.find(t => t._id === id);
      if (task) previousTask = task;
      return prev.map(t => t._id === id ? { ...t, status } : t);
    });

    try {
      const response = await tasksAPI.updateStatus(id, status);
      setTasks(prev => prev.map(t => t._id === id ? response.data : t));
      return { success: true, data: response.data };
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
    refreshData: fetchAllData
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
