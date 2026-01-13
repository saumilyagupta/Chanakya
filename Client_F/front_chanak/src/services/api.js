/**
 * API Service using Axios
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for long-running queries
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Query the orchestrator
 */
export const queryOrchestrator = async (query, context = {}) => {
  const response = await apiClient.post('/api/query/query', {
    query,
    context: {
      session_id: `session_${Date.now()}`,
      ...context,
    },
  });
  return response.data;
};

/**
 * Get orchestrator status
 */
export const getOrchestratorStatus = async () => {
  const response = await apiClient.get('/api/query/status');
  return response.data;
};

/**
 * Get available tools
 */
export const getAvailableTools = async () => {
  const response = await apiClient.get('/api/query/tools');
  return response.data;
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Auth - Signup
 */
export const signup = async (userData) => {
  const response = await apiClient.post('/api/auth/signup', userData);
  return response.data;
};

/**
 * Auth - Login
 */
export const login = async (credentials) => {
  const response = await apiClient.post('/api/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('auth_token', response.data.token);
  }
  return response.data;
};

/**
 * Auth - Logout
 */
export const logout = async () => {
  const response = await apiClient.post('/api/auth/logout');
  localStorage.removeItem('auth_token');
  return response.data;
};

/**
 * Get user profile
 */
export const getUserProfile = async () => {
  const response = await apiClient.get('/api/users/profile');
  return response.data;
};

export default apiClient;
