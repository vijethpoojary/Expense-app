import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Expense APIs
export const expenseAPI = {
  getAll: (filters = {}) => api.get('/expenses', { params: filters }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories'),
};

// Salary APIs
export const salaryAPI = {
  get: () => api.get('/salary'),
  getStats: () => api.get('/salary/stats'),
  update: (data) => api.post('/salary', data),
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

