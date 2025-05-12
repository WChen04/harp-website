<template>
  <Header
    title=""
    subtitle="Grant or Revoke Admin Status"
  />
  <div class="admin-status-container">
    <div class="header-container">
      <h1>User Administration</h1>
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by name or email..." 
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search-button" aria-label="Clear search">
          ×
        </button>
      </div>
    </div>
    
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
    
    <div v-if="!loading && filteredUsers.length === 0" class="no-users">
      <span class="icon">🔍</span>
      <p v-if="searchQuery">
        No users found matching "<span class="search-term">{{ searchQuery }}</span>".
      </p>
      <p v-else>
        No users found in the system.
      </p>
    </div>
    
    <div v-if="filteredUsers.length > 0" class="users-table-wrapper">
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
      
      <div class="pagination-info" v-if="filteredUsers.length > 0">
        Showing {{ paginationInfo.from }} to {{ paginationInfo.to }} of {{ filteredUsers.length }} users
        <span v-if="searchQuery && filteredUsers.length !== users.length">
          (filtered from {{ users.length }} total)
        </span>
      </div>
    </div>
  </div>
  <Footer />
</template>
  
<script>
import apiClient from '../../utils/axios-config.js';
import { useAuthStore } from '../../utils/authClient.js';
import Header from "@/components/General/Header.vue";
import Footer from "@/components/General/Footer.vue";

export default {
  components: {
    Header,
    Footer
  },
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
      maxPageNumbers: 5,
      // Search
      searchQuery: '',
      searchTimeout: null
    };
  },
  
  computed: {
    // Filter users based on search query
    filteredUsers() {
      if (!this.searchQuery) {
        return this.users;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      
      return this.users.filter(user => {
        const nameMatch = user.full_name && user.full_name.toLowerCase().includes(query);
        const emailMatch = user.email && user.email.toLowerCase().includes(query);
        return nameMatch || emailMatch;
      });
    },
    
    // Get users for current page based on filtered results
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.usersPerPage;
      const end = start + this.usersPerPage;
      return this.filteredUsers.slice(start, end);
    },
    
    // Calculate total pages based on filtered results
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.usersPerPage);
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
        if (this.totalPages > 1) {
          pages.push(this.totalPages);
        }
      }
      
      return pages;
    },
    
    // Information about current pagination state
    paginationInfo() {
      if (this.filteredUsers.length === 0) {
        return { from: 0, to: 0 };
      }
      
      const from = (this.currentPage - 1) * this.usersPerPage + 1;
      const to = Math.min(from + this.usersPerPage - 1, this.filteredUsers.length);
      
      return {
        from: from,
        to: to
      };
    }
  },
  
  watch: {
    // Reset to first page when search query changes
    filteredUsers() {
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = 1;
      }
    }
  },
  
  methods: {
    async fetchUsers() {
      const baseURL = import.meta.env.VITE_API_URL || '';
      this.loading = true;
      this.error = null;
      
      try {
        const response = await apiClient.get(`${baseURL}/api/admin/users`, {
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
      const baseURL = import.meta.env.VITE_API_URL || '';
      try {
        const response = await apiClient.get(`${baseURL}/api/me`, {
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
      const baseURL = import.meta.env.VITE_API_URL || '';
      if (this.isCurrentUser(user.email) || this.processing) return;
      
      this.processing = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        const response = await apiClient.put(`${baseURL}/api/admin/users/${user.email}/toggle-admin`, {}, {
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
    },
    
    // Handle search input with debounce
    handleSearch() {
      // Reset to first page when search changes
      this.currentPage = 1;
      
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Set a new timeout to avoid searching on every keystroke
      this.searchTimeout = setTimeout(() => {
        // The actual search happens automatically via the computed property
        console.log('Searching for:', this.searchQuery);
      }, 300);
    },
    
    // Clear search query
    clearSearch() {
      this.searchQuery = '';
      this.currentPage = 1;
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
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
}
</script>
  
<style scoped>
@import "../components/Admin/AdminStatus.css";
</style>