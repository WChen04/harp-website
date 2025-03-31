<template>
    <div class="admin-status-container">
      <h1>User Administration</h1>
      
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>
      
      <div v-if="error" class="error-alert">
        <p>{{ error }}</p>
      </div>
      
      <div v-if="successMessage" class="success-alert">
        <p>{{ successMessage }}</p>
      </div>
      
      <div v-if="!loading && users.length === 0" class="no-users">
        <p>No users found in the system.</p>
      </div>
      
      <div v-if="users.length > 0" class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Admin Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.email">
              <td class="user-info">
                <div class="user-avatar" v-if="user.profile_picture">
                  <img :src="user.profile_picture" :alt="user.full_name" />
                </div>
                <div class="user-avatar default-avatar" v-else>
                  {{ getUserInitials(user.full_name) }}
                </div>
                <span>{{ user.full_name || 'Unknown' }}</span>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="status-badge" :class="user.is_admin ? 'admin' : 'regular'">
                  {{ user.is_admin ? 'Admin' : 'Regular User' }}
                </span>
              </td>
              <td>
                <button 
                  @click="toggleAdminStatus(user)"
                  :disabled="isCurrentUser(user.email) || processing"
                  :class="[
                    'action-button', 
                    user.is_admin ? 'revoke-button' : 'grant-button',
                    isCurrentUser(user.email) ? 'disabled' : ''
                  ]"
                >
                  {{ user.is_admin ? 'Revoke Admin' : 'Grant Admin' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { useAuthStore } from '../stores/auth.js';
  
  export default {
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    name: 'AdminStatus',
    data() {
      return {
        users: [],
        loading: true,
        error: null,
        isAdmin: false,
        successMessage: null,
        processing: false,
        currentUser: null
      };
    },
    
    methods: {
      async fetchUsers() {
        this.loading = true;
        this.error = null;
        
        try {
          const response = await axios.get('/api/admin/users', {
            withCredentials: true
          });
          this.users = response.data;
        } catch (err) {
          console.error('Failed to fetch users:', err);
          this.error = err.response?.data?.error || 'Failed to load users. Please try again.';
        } finally {
          this.loading = false;
        }
      },
      
      async fetchCurrentUser() {
        try {
            const response = await axios.get('http://localhost:3000/api/me', {
            withCredentials: true
            });
            this.currentUser = response.data;
            console.log('Current user data loaded:', this.currentUser);
            return this.currentUser;
        } catch (err) {
            console.error('Failed to fetch current user:', err);
            // Redirect to login if not authenticated
            if (err.response?.status === 401) {
            this.$router.push('/login');
            }
            throw err;
        }
        },
      
      async toggleAdminStatus(user) {
        if (this.isCurrentUser(user.email) || this.processing) return;
        
        this.processing = true;
        this.error = null;
        this.successMessage = null;
        
        try {
          const response = await axios.put(`/api/admin/users/${user.email}/toggle-admin`, {}, {
            withCredentials: true
          });
          
          // Update user in the list
          const index = this.users.findIndex(u => u.email === user.email);
          if (index !== -1) {
            this.users[index].is_admin = response.data.is_admin;
          }
          
          this.successMessage = response.data.message;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        } catch (err) {
          console.error('Failed to update admin status:', err);
          this.error = err.response?.data?.error || 'Failed to update admin status. Please try again.';
        } finally {
          this.processing = false;
        }
      },
      
      isCurrentUser(email) {
        return this.currentUser && this.currentUser.email === email;
      },
      
      getUserInitials(name) {
        if (!name) return '?';
        
        return name
          .split(' ')
          .map(part => part.charAt(0).toUpperCase())
          .slice(0, 2)
          .join('');
      },
      
      // Clear alerts when navigating away
      clearAlerts() {
        this.error = null;
        this.successMessage = null;
      }
    },
    async created() {
        console.log('AdminStatus component created');
        this.loading = true;
        
        try {
            // First fetch the current user
            await this.fetchCurrentUser();
            
            // Check if user is an admin
            if (!this.currentUser?.is_admin) {
            console.log('User is not admin, redirecting');
            this.$router.push('/');
            return;
            }
            
            // Only fetch users if the current user is an admin
            await this.fetchUsers();
        } catch (error) {
            console.error('Error initializing component:', error);
            this.error = 'Failed to initialize the admin panel. Please try again.';
        } finally {
            this.loading = false;
        }
        },
    
    beforeUnmount() {
      this.clearAlerts();
    },
  }
  
  </script>
  
  <style scoped>
  .admin-status-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-alert, .success-alert {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .error-alert {
    background-color: #ffebee;
    color: #c62828;
    border-left: 4px solid #c62828;
  }
  
  .success-alert {
    background-color: #e8f5e9;
    color: #2e7d32;
    border-left: 4px solid #2e7d32;
  }
  
  .users-table-wrapper {
    overflow-x: auto;
  }
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  .users-table th, .users-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .users-table th {
    background-color: #f9f9f9;
    font-weight: bold;
  }
  
  .users-table tr:hover {
    background-color: #f5f5f5;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .default-avatar {
    background-color: #3498db;
    color: white;
    font-weight: bold;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status-badge.admin {
    background-color: #3949ab;
    color: white;
  }
  
  .status-badge.regular {
    background-color: #78909c;
    color: white;
  }
  
  .action-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .grant-button {
    background-color: #3949ab;
    color: white;
  }
  
  .grant-button:hover {
    background-color: #303f9f;
  }
  
  .revoke-button {
    background-color: #f44336;
    color: white;
  }
  
  .revoke-button:hover {
    background-color: #d32f2f;
  }
  
  .action-button.disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .no-users {
    text-align: center;
    padding: 2rem;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  </style>