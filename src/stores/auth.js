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
    async fetchCurrentUser() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get('http://localhost:3000/api/me', {
          withCredentials: true // Important for cookies to be sent
        });
        
        this.user = response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch user';
        this.user = null;
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
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  }
});