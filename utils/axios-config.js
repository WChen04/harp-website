// src/utils/axios-config.js
import axios from 'axios';
import { useAuthStore } from '/auth';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for API calls
apiClient.interceptors.request.use(config => {
  const authStore = useAuthStore();
  
  // Add auth token if available
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  
  return config;
});

// Response interceptor for API calls
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const authStore = useAuthStore();
    
    // Handle 401 (Unauthorized) errors
    if (error.response && error.response.status === 401) {
      // Clear authentication if token is rejected
      authStore.clearAuth();
      
      // Redirect to login page if not already there
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;