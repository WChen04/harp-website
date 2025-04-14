import { defineStore } from 'pinia';
import axios from 'axios';

// Get API base URL from environment variable or use default for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.is_admin || false,
    // Add a getter for the auth header to use in API requests
    authHeader: (state) => state.token ? { Authorization: `Bearer ${state.token}` } : {}
  },
  
  actions: {
    setUser(userData, token = null) {
      this.user = userData;
      this.token = token;
      
      // Store in localStorage
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        if (token) {
          localStorage.setItem('token', token);
        }
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    },
    
    async checkAuthStatus() {
      // First check localStorage
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
          this.token = storedToken;
          
          // Validate with server that session/token is still valid
          await this.validateSession();
          return;
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      
      // If no local data or parsing failed, check with server
      await this.fetchCurrentUser();
    },
    
    async validateSession() {
      try {
        // If we have a token, use it for JWT auth
        if (this.token) {
          const response = await axios.get(`${API_BASE_URL}/api/me`, {
            headers: { ...this.authHeader }
          });
          
          if (response.data && response.data.email) {
            // Update user data
            this.user = response.data;
          } else {
            this.clearAuth();
          }
        } 
        // Fall back to session validation if no token (for compatibility)
        else {
          const response = await axios.get(`${API_BASE_URL}/api/me`, {
            withCredentials: true
          });
          
          if (response.data && response.data.email) {
            this.user = response.data;
          } else {
            this.clearAuth();
          }
        }
      } catch (error) {
        this.clearAuth();
      }
    },
    
    async fetchCurrentUser() {
      this.loading = true;
      this.error = null;
      
      try {
        // Try using JWT token if available
        if (this.token) {
          const response = await axios.get(`${API_BASE_URL}/api/me`, {
            headers: { ...this.authHeader }
          });
          
          if (response.data && response.data.email) {
            this.user = response.data;
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            this.clearAuth();
          }
        } 
        // Fall back to session-based auth for compatibility
        else {
          const response = await axios.get(`${API_BASE_URL}/api/me`, {
            withCredentials: true
          });
          
          if (response.data && response.data.email) {
            this.user = response.data;
            localStorage.setItem('user', JSON.stringify(response.data));
            
            // If response includes a token, store it (for JWT transition)
            if (response.data.token) {
              this.token = response.data.token;
              localStorage.setItem('token', response.data.token);
            }
          } else {
            this.clearAuth();
          }
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch user';
        this.clearAuth();
      } finally {
        this.loading = false;
      }
    },
    
    clearAuth() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, credentials);
        
        // Handle JWT response
        if (response.data.token) {
          this.token = response.data.token;
          localStorage.setItem('token', response.data.token);
        }
        
        if (response.data.user) {
          this.user = response.data.user;
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return true;
      } catch (error) {
        this.error = error.response?.data?.error || 'Login failed';
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    async logout() {
      try {
        // If we have a token, use it for JWT logout
        if (this.token) {
          await axios.post(`${API_BASE_URL}/api/logout`, {}, {
            headers: { ...this.authHeader }
          });
        } 
        // Fall back to session-based logout
        else {
          await axios.post(`${API_BASE_URL}/api/logout`, {}, {
            withCredentials: true
          });
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Always clear local state even if server logout fails
        this.clearAuth();
      }
    }
  }
});