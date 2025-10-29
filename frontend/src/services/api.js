import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Handle token expiration
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
  register: (userData) => {
    console.log('API: Registering user', userData);
    return api.post('/auth/register', userData);
  },
  login: (credentials) => {
    console.log('API: Logging in user', credentials.email);
    return api.post('/auth/login', credentials);
  },
  getProfile: () => {
    console.log('API: Getting profile');
    return api.get('/auth/profile');
  },
  createDemoUsers: () => {
    console.log('API: Creating demo users');
    return api.post('/auth/create-demo-users');
  },
};

// Policies API
export const policiesAPI = {
  getAll: () => api.get('/policies'),
  getById: (id) => api.get(`/policies/${id}`),
  create: (policyData) => api.post('/policies', policyData),
  update: (id, policyData) => api.put(`/policies/${id}`, policyData),
  delete: (id) => api.delete(`/policies/${id}`),
  submit: (id) => api.post(`/policies/${id}/submit`),
  approve: (id, action, comment) => api.post(`/policies/${id}/approve`, { action, comment }),
};

export default api;
