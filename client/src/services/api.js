import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Send cookies with every request
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Expense APIs
export const expenseAPI = {
  getAll: (filters = {}) => api.get('/expenses', { params: filters }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories'),
  getHistory: () => api.get('/expenses/history'),
};

// Salary APIs
export const salaryAPI = {
  get: () => api.get('/salary'),
  getStats: () => {
    // Get user's timezone offset in minutes
    const timezoneOffset = -new Date().getTimezoneOffset();
    return api.get('/salary/stats', { params: { timezoneOffset } });
  },
  update: (data) => api.post('/salary', data),
  resetAll: () => api.post('/salary/reset'),
};

// Investment APIs
export const investmentAPI = {
  getAll: (filters = {}) => api.get('/investments', { params: filters }),
  getById: (id) => api.get(`/investments/${id}`),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  delete: (id) => api.delete(`/investments/${id}`),
  getTypes: () => api.get('/investments/types'),
};

// Analytics APIs
export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
  getMonthlySummary: (year, month) => api.get('/analytics/monthly', { params: { year, month } }),
};

export default api;

