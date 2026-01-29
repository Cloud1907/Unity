import axios from 'axios';

// API Base URL Configuration
// ALWAYS use relative path for production deployment flexibility
// This ensures the app works on any domain/protocol without hardcoded URLs

const getBaseUrl = () => {
  // FORCE relative path - works with any domain/protocol
  // Frontend and backend are served from the same origin in production
  return '';
};

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api`;


// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and user ID to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }



    return config;
  },
  (error) => Promise.reject(error)
);



let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do NOT refresh or redirect if the 401 comes from the login endpoint itself
      if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // We use axios directly to avoid interceptors loop
          const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });

          if (response.status === 200) {
            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
            processQueue(null, access_token);
            originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
            return api(originalRequest);
          }
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  refresh: (data) => api.post('/auth/refresh', data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateProjects: (id, projectIds) => api.put(`/users/${id}/projects`, projectIds),
  delete: (id) => api.delete(`/users/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  addMember: (id, userId) => api.post(`/departments/${id}/members`, JSON.stringify(userId), { headers: { 'Content-Type': 'application/json' } }),
  removeMember: (id, userId) => api.delete(`/departments/${id}/members/${userId}`),
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
  update: (id, data) => api.patch(`/tasks/${id}`, data),
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

// Labels API
export const labelsAPI = {
  getAll: (globalOnly = false) => api.get('/labels', { params: { global_only: globalOnly } }),
  getByProject: (projectId) => api.get(`/labels/project/${projectId}`),
  create: (data) => api.post('/labels', data),
  update: (id, data) => api.put(`/labels/${id}`, data),
  delete: (id) => api.delete(`/labels/${id}`),
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
};

// Activity API
export const activityAPI = {
  getAll: (params) => api.get('/activity', { params }),
};

// Audit API (Task/Project History)
export const auditAPI = {
  getTaskLogs: (taskId) => api.get(`/audit/task/${taskId}`),
  getProjectLogs: (projectId) => api.get(`/audit/project/${projectId}`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getWorkload: () => api.get('/analytics/workload'),
  getProjectProgress: () => api.get('/analytics/project-progress'),
};

export default api;
