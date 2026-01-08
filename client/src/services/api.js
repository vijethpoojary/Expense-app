import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Send cookies with every request
});

// CSRF token management
let csrfToken = null;

// Fetch CSRF token from server
export const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
      withCredentials: true
    });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// Request interceptor to add CSRF token to state-changing requests
api.interceptors.request.use(
  async (config) => {
    // Only add CSRF token to state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (stateChangingMethods.includes(config.method.toUpperCase())) {
      // Fetch token if not available
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      
      // Add CSRF token to header
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF token errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If CSRF token error, refresh token and retry
    if (error.response?.status === 403 && 
        error.response?.data?.message?.includes('CSRF')) {
      // Refresh CSRF token
      await fetchCsrfToken();
      
      // Retry the original request
      if (csrfToken && error.config) {
        error.config.headers['X-CSRF-Token'] = csrfToken;
        return api.request(error.config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Initialize CSRF token on module load
fetchCsrfToken();

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
  getHistory: (roomId, filters = {}) => api.get(`/room-expenses/${roomId}/history`, { params: filters }),
  getAnalytics: (roomId) => api.get(`/room-expenses/${roomId}/analytics`),
  getDebtBreakdown: (roomId) => api.get(`/room-expenses/${roomId}/debt-breakdown`),
  updatePaymentStatus: (expenseId, memberUserId, status) => api.put(`/room-expenses/${expenseId}/status`, { memberUserId, status }),
  updatePartialPayment: (expenseId, memberUserId, paidAmount, shareAmount) => {
    const body = { memberUserId };
    if (paidAmount !== null && paidAmount !== undefined) {
      body.paidAmount = paidAmount;
    }
    if (shareAmount !== null && shareAmount !== undefined) {
      body.shareAmount = shareAmount;
    }
    return api.put(`/room-expenses/${expenseId}/partial-payment`, body);
  },
  delete: (expenseId) => api.delete(`/room-expenses/${expenseId}`),
  resetAll: (roomId) => api.delete(`/room-expenses/${roomId}/reset`),
};

export default api;

