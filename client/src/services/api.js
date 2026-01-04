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
  deleteSelected: (ids) => api.delete('/expenses/selected', { data: { ids } }),
  deleteAll: () => api.delete('/expenses/all'),
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
  deleteSelected: (ids) => api.delete('/investments/selected', { data: { ids } }),
  deleteAll: () => api.delete('/investments/all'),
  getTypes: () => api.get('/investments/types'),
};

// Analytics APIs
export const analyticsAPI = {
  getAnalytics: () => {
    // Get user's timezone offset in minutes
    const timezoneOffset = -new Date().getTimezoneOffset();
    return api.get('/analytics', { params: { timezoneOffset } });
  },
  getMonthlySummary: (year, month) => api.get('/analytics/monthly', { params: { year, month } }),
};

// Room APIs
export const roomAPI = {
  create: (data) => api.post('/rooms', data),
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  addMember: (roomId, data) => api.post(`/rooms/${roomId}/members`, data),
  removeMember: (roomId, data) => api.delete(`/rooms/${roomId}/members`, { data }),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// Room Expense APIs
export const roomExpenseAPI = {
  create: (data) => api.post('/room-expenses', data),
  getByRoom: (roomId, filters = {}) => api.get(`/room-expenses/${roomId}`, { params: filters }),
  getAnalytics: (roomId) => api.get(`/room-expenses/${roomId}/analytics`),
  updatePaymentStatus: (expenseId, memberUserId, status) => api.put(`/room-expenses/${expenseId}/status`, { memberUserId, status }),
};

export default api;

