import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsAPI, tasksAPI, usersAPI, departmentsAPI } from '../services/api';
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
      setTasks(response.data);
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

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchUsers(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }, [fetchProjects, fetchTasks, fetchUsers, fetchDepartments]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // Project operations
  const createProject = async (data) => {
    try {
      const response = await projectsAPI.create(data);
      setProjects([...projects, response.data]);
      toast.success('Proje oluşturuldu!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Proje oluşturulamadı');
      return { success: false, error };
    }
  };

  const updateProject = async (id, data) => {
    try {
      const response = await projectsAPI.update(id, data);
      setProjects(projects.map(p => p._id === id ? response.data : p));
      toast.success('Proje güncellendi!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Proje güncellenemedi');
      return { success: false, error };
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectsAPI.delete(id);
      setProjects(projects.filter(p => p._id !== id));
      toast.success('Proje silindi!');
      return { success: true };
    } catch (error) {
      toast.error('Proje silinemedi');
      return { success: false, error };
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const response = await projectsAPI.toggleFavorite(id);
      setProjects(projects.map(p => p._id === id ? response.data : p));
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Favori durumu değiştirilemedi');
      return { success: false, error };
    }
  };

  // Task operations
  const createTask = async (data) => {
    try {
      console.log('📝 Creating task with data:', data);
      const response = await tasksAPI.create(data);
      console.log('✅ Task created successfully:', response.data);
      const newTasks = [...tasks, response.data];
      console.log('📊 Updated tasks array:', newTasks);
      setTasks(newTasks);
      toast.success('Görev oluşturuldu!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Task creation failed:', error);
      toast.error('Görev oluşturulamadı');
      return { success: false, error };
    }
  };

  const updateTask = async (id, data) => {
    try {
      const response = await tasksAPI.update(id, data);
      setTasks(tasks.map(t => t._id === id ? response.data : t));
      toast.success('Görev güncellendi!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Görev güncellenemedi');
      return { success: false, error };
    }
  };

  const deleteTask = async (id) => {
    try {
      await tasksAPI.delete(id);
      setTasks(tasks.filter(t => t._id !== id));
      toast.success('Görev silindi!');
      return { success: true };
    } catch (error) {
      toast.error('Görev silinemedi');
      return { success: false, error };
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      const response = await tasksAPI.updateStatus(id, status);
      setTasks(tasks.map(t => t._id === id ? response.data : t));
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Durum güncellenemedi');
      return { success: false, error };
    }
  };

  const value = React.useMemo(() => ({
    projects,
    tasks,
    users,
    departments,
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
  }), [projects, tasks, users, departments, loading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
