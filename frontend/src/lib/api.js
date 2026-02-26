import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Costs
export const costAPI = {
  getOverview: (params) => api.get('/costs/overview', { params }),
  getBySubscription: (params) => api.get('/costs/by-subscription', { params }),
  getTopResources: (params) => api.get('/costs/top-resources', { params }),
  getByTags: (params) => api.get('/costs/by-tags', { params }),
  getDaily: (params) => api.get('/costs/daily', { params }),
};

// Resources
export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  getTypes: () => api.get('/resources/types'),
};

// Alerts
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getStats: () => api.get('/alerts/stats'),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
};

// Recommendations
export const recommendationAPI = {
  getAll: (params) => api.get('/recommendations', { params }),
  getSummary: () => api.get('/recommendations/summary'),
  updateStatus: (id, status) => api.put(`/recommendations/${id}/status`, { status }),
};

// Budgets
export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Reports
export const reportAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post('/reports/generate', data),
  getForecast: (params) => api.get('/reports/forecast', { params }),
  getAnomalies: (params) => api.get('/reports/anomalies', { params }),
};

export default api;
