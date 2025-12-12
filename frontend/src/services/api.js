import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { user_id: userId }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  toggleFavorite: (id) => api.put(`/projects/${id}/favorite`),
};

// Tasks API
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, null, { params: { status } }),
  updateProgress: (id, progress) => api.put(`/tasks/${id}/progress`, null, { params: { progress } }),
  assign: (id, userId) => api.post(`/tasks/${id}/assign`, null, { params: { user_id: userId } }),
};

// Subtasks API
export const subtasksAPI = {
  getAll: (taskId) => api.get(`/tasks/${taskId}/subtasks`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
  update: (id, data) => api.put(`/tasks/subtasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/subtasks/${id}`),
};

// Comments API
export const commentsAPI = {
  getAll: (taskId) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  update: (id, data) => api.put(`/tasks/comments/${id}`, data),
  delete: (id) => api.delete(`/tasks/comments/${id}`),
};

// TimeLogs API
export const timelogsAPI = {
  getAll: (params) => api.get('/timelogs', { params }),
  create: (data) => api.post('/timelogs', data),
  update: (id, data) => api.put(`/timelogs/${id}`, data),
  delete: (id) => api.delete(`/timelogs/${id}`),
  getReports: (params) => api.get('/timelogs/reports', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Activity API
export const activityAPI = {
  getAll: (params) => api.get('/activity', { params }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getWorkload: () => api.get('/analytics/workload'),
  getProjectProgress: () => api.get('/analytics/project-progress'),
};

export default api;
