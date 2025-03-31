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
            <tr v-for="(user, index) in paginatedUsers" :key="user.email || index">
              <td class="user-info">
                <div class="user-avatar" v-if="user.profile_picture">
                  <img :src="user.profile_picture" :alt="user.full_name" />
                </div>
                <div class="user-avatar default-avatar" v-else>
                  {{ getUserInitials(user.full_name) }}
                </div>
                <span>{{ user.full_name || 'Missing Name' }}</span>
                <!-- Debug info -->
                <small v-if="!user.full_name" style="color: red;">(Debug: {{ JSON.stringify(user) }})</small>
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
        
        <!-- Pagination Controls -->
        <div class="pagination-controls" v-if="totalPages > 1">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="pagination-button"
          >
            Previous
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in displayedPageNumbers" 
              :key="page" 
              @click="changePage(page)"
              :class="['page-number', currentPage === page ? 'active' : '']"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="pagination-button"
          >
            Next
          </button>
        </div>
        
        <div class="pagination-info" v-if="users.length > 0">
          Showing {{ paginationInfo.from }} to {{ paginationInfo.to }} of {{ users.length }} users
        </div>
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
        currentUser: null,
        // Pagination
        currentPage: 1,
        usersPerPage: 10,
        maxPageNumbers: 5
      };
    },
    
    computed: {
      // Get users for current page
      paginatedUsers() {
        const start = (this.currentPage - 1) * this.usersPerPage;
        const end = start + this.usersPerPage;
        return this.users.slice(start, end);
      },
      
      // Calculate total pages
      totalPages() {
        return Math.ceil(this.users.length / this.usersPerPage);
      },
      
      // Create an array of page numbers to display
      displayedPageNumbers() {
        let pages = [];
        
        if (this.totalPages <= this.maxPageNumbers) {
          // If we have fewer pages than max, show all pages
          for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
          }
        } else {
          // Always include first page
          pages.push(1);
          
          let startPage = Math.max(2, this.currentPage - 1);
          let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
          
          // Add ellipsis if needed
          if (startPage > 2) {
            pages.push('...');
          }
          
          // Add pages around current page
          for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
          }
          
          // Add ellipsis if needed
          if (endPage < this.totalPages - 1) {
            pages.push('...');
          }
          
          // Always include last page
          pages.push(this.totalPages);
        }
        
        return pages;
      },
      
      // Information about current pagination state
      paginationInfo() {
        const from = (this.currentPage - 1) * this.usersPerPage + 1;
        const to = Math.min(from + this.usersPerPage - 1, this.users.length);
        
        return {
          from: from,
          to: to
        };
      }
    },
    
    methods: {
      async fetchUsers() {
        this.loading = true;
        this.error = null;
        
        try {
          const response = await axios.get('http://localhost:3000/api/admin/users', {
            withCredentials: true
          });
          
          console.log('Users API response:', response);
          console.log('Raw users data:', response.data);
          
          // Check each user individually
          response.data.forEach((user, index) => {
            console.log(`User ${index}:`, {
              email: user.email,
              name: user.full_name,
              is_admin: user.is_admin,
              has_profile: !!user.profile_picture
            });
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
      },
      
      // Change the current page
      changePage(page) {
        // Don't do anything if page is an ellipsis
        if (page === '...') return;
        
        // Make sure page is within valid range
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          
          // Scroll to top of table
          const tableEl = document.querySelector('.users-table');
          if (tableEl) {
            tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
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
  
  /* Pagination Controls Styles */
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
    gap: 0.5rem;
  }
  
  .pagination-button {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .pagination-button:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
  
  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-numbers {
    display: flex;
    gap: 0.25rem;
  }
  
  .page-number {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f5f5f5;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .page-number:hover:not(.active) {
    background-color: #e0e0e0;
  }
  
  .page-number.active {
    background-color: #3949ab;
    color: white;
    border-color: #3949ab;
  }
  
  .pagination-info {
    text-align: center;
    margin-top: 1rem;
    color: #666;
    font-size: 0.875rem;
  }
  </style>