import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.is_admin || false
  },
  
  actions: {
    setUser(userData) {
      this.user = userData;
      
      // Store in localStorage
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user');
      }
    },
    
    async checkAuthStatus() {
      // First check localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
          // Validate with server that session is still valid
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
        const response = await axios.get('http://localhost:3000/api/me', {
          withCredentials: true
        });
        
        if (response.data && response.data.email) {
          // Update user data
          this.user = response.data;
        } else {
          this.user = null;
          localStorage.removeItem('user');
        }
      } catch (error) {
        this.user = null;
        localStorage.removeItem('user');
      }
    },
    
    async fetchCurrentUser() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get('http://localhost:3000/api/me', {
          withCredentials: true
        });
        
        if (response.data && response.data.email) {
          this.user = response.data;
          localStorage.setItem('user', JSON.stringify(response.data));
        } else {
          this.user = null;
          localStorage.removeItem('user');
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch user';
        this.user = null;
        localStorage.removeItem('user');
      } finally {
        this.loading = false;
      }
    },
    
    async logout() {
      try {
        await axios.post('http://localhost:3000/api/logout', {}, {
          withCredentials: true
        });
        this.user = null;
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear local state even if server logout fails
        this.user = null;
        localStorage.removeItem('user');
      }
    }
  }
});