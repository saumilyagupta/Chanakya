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
  timeout: 180000, // 180 seconds for long-running queries
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('access_token');
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
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
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
    session_id: context.session_id || `session_${Date.now()}`,
    context: context,
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
    localStorage.setItem('access_token', response.data.token);
  }
  return response.data;
};

/**
 * Auth - Logout
 */
export const logout = async () => {
  const response = await apiClient.post('/api/auth/logout');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  return response.data;
};

/**
 * Get user profile
 */
export const getUserProfile = async () => {
  const response = await apiClient.get('/api/users/me');
  return response.data;
};

/**
 * Chat History - Get recent sessions for authenticated user
 */
export const getChatHistory = async (limit = 20) => {
  const response = await apiClient.get(`/api/chat/history?limit=${limit}`);
  return response.data;
};

/**
 * Chat History - Get specific session messages
 */
export const getSessionMessages = async (sessionId) => {
  const response = await apiClient.get(`/api/chat/session/${sessionId}/messages`);
  return response.data;
};

/**
 * Chat History - Delete a session
 */
export const deleteSession = async (sessionId) => {
  const response = await apiClient.delete(`/api/chat/session/${sessionId}`);
  return response.data;
};

export default apiClient;
