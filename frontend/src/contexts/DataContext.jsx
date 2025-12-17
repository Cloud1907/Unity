import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsAPI, tasksAPI, usersAPI, departmentsAPI, labelsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from '../components/ui/sonner';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
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
        // If retrieving all tasks (no projectId), verify overlap or overwrite? 
        // Safer to overwrite if no projectId is passed (initial load).
        if (!projectId) return response.data;

        // If specific projectId, merge with existing tasks
        // 1. Remove old tasks for this project (to handle deletions/updates correctly)
        const otherTasks = prevTasks.filter(t => t.projectId !== projectId);
        // 2. Add new tasks
        return [...otherTasks, ...response.data];
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
        setLabels(response.data);
      } else {
        // Fetch all labels for all projects
        const allLabels = [];
        for (const project of projects) {
          const response = await labelsAPI.getByProject(project._id);
          allLabels.push(...response.data);
        }
        setLabels(allLabels);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, [projects]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchUsers(),
        fetchDepartments()
      ]);
      // Fetch labels after projects are loaded
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
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success('Proje silindi!');
      return { success: true };
    } catch (error) {
      toast.error('Proje silinemedi');
      return { success: false, error };
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const response = await projectsAPI.toggleFavorite(id);
      setProjects(prev => prev.map(p => p._id === id ? response.data : p));
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Favori durumu değiştirilemedi');
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
    try {
      const response = await tasksAPI.update(id, data);
      setTasks(prev => prev.map(t => t._id === id ? response.data : t));
      toast.success('Görev güncellendi!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Görev güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await tasksAPI.delete(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Görev silindi!');
      return { success: true };
    } catch (error) {
      toast.error('Görev silinemedi');
      return { success: false, error };
    }
  }, []);

  const updateTaskStatus = useCallback(async (id, status) => {
    try {
      const response = await tasksAPI.updateStatus(id, status);
      setTasks(prev => prev.map(t => t._id === id ? response.data : t));
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Durum güncellenemedi');
      return { success: false, error };
    }
  }, []);

  const value = React.useMemo(() => ({
    projects,
    tasks,
    users,
    departments,
    labels,
    loading,
    fetchProjects,
    fetchTasks,
    fetchUsers,
    fetchDepartments,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refreshData: fetchAllData
  }), [
    projects,
    tasks,
    users,
    departments,
    labels,
    loading,
    fetchProjects,
    fetchTasks,
    fetchUsers,
    fetchDepartments,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    fetchAllData
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
