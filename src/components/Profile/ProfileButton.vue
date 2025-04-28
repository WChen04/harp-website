<!-- ProfileButton.vue -->
<template>
  <div class="profile-container">
    <button 
      @click="toggleDropdown" 
      class="profile-button"
      :class="{ 'active': showDropdown }"
    >
      <!-- Show profile picture if available, otherwise show default user icon -->
      <img 
        v-if="profilePictureLocal" 
        :src="profilePictureLocal" 
        class="profile-image" 
        alt="Profile"
      />
      <svg 
        v-else 
        xmlns="http://www.w3.org/2000/svg" 
        class="user-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </button>
    
    <div v-if="showDropdown" class="dropdown-menu">
      <div class="dropdown-header">
        <img 
          v-if="profilePictureLocal" 
          :src="profilePictureLocal" 
          class="dropdown-profile-image" 
          alt="Profile"   
        />
        <div class="user-name">{{ fullName }}</div>
      </div>
      <button @click="showProfilePictureModal = true; showDropdown = false" class="menu-button">
        Change Profile Picture
      </button>
      <button @click="signOut" class="sign-out-button">Sign Out</button>
    </div>
    
    <!-- Profile Picture Upload Modal -->
    <div v-if="showProfilePictureModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-button" @click="closeModal">&times;</button>
        <ProfilePictureUpload @picture-updated="onPictureUpdated" />
      </div>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';
import ProfilePictureUpload from '../../views/ProfilePictureUpload.vue';

export default {
  name: 'ProfileButton',
  
  components: {
    ProfilePictureUpload
  },
  
  props: {
    fullName: {
      type: String,
      required: true
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      showDropdown: false,
      showProfilePictureModal: false,
      profilePictureLocal: this.profilePicture // Make a local copy of the prop
    }
  },

  watch: {
    // Watch for changes to the prop and update local copy
    profilePicture: {
      immediate: true,
      handler(newVal) {
        this.profilePictureLocal = newVal;
      }
    }
  },
  
  created() {
    // Load initial data from localStorage
    this.loadUserData();
    
    // Listen for profile picture updates
    window.addEventListener('storage', this.loadUserData);
  },
  
  beforeUnmount() {
    window.removeEventListener('storage', this.loadUserData);
  },
  
  
  methods: {
    async loadUserData() {
      const baseURL = import.meta.env.VITE_API_URL || '';
      try {
        // First check if the user is logged in
        const authCheckResponse = await fetch(`${baseURL}/api/auth-check`);
        
        if (!authCheckResponse.ok) {
          console.log('User not authenticated, redirecting to login...');
          this.$router.push('/login');
          return;
        }
        
        // Now try to load the user data
        const response = await fetch(`${baseURL}/api/user`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // Store in localStorage
          localStorage.setItem('userData', JSON.stringify(userData));
          
          // Update the local profile picture
          if (userData.profile_picture) {
            this.profilePictureLocal = userData.profile_picture;
            this.$emit('update:profilePicture', userData.profile_picture);
          }
        } else {
          console.error('Error loading user data:', response.status);
        }
      } catch (error) {
        console.error('Error in loadUserData:', error);
      }
    },
    
    closeModal() {
      this.showProfilePictureModal = false;
    },
    
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    
    onPictureUpdated(newPictureUrl) {
      // Update local state
      this.profilePictureLocal = newPictureUrl;
      
      // Emit to parent for two-way binding
      this.$emit('update:profilePicture', newPictureUrl);
      
      this.closeModal();
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.profile_picture = newPictureUrl;
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Update user data in localStorage too
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.profile_picture = newPictureUrl;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Dispatch a global event for other components
      window.dispatchEvent(new CustomEvent('profile-picture-updated', { 
        detail: { profilePicture: newPictureUrl }
      }));
      
      // Emit event to parent components
      this.$emit('profile-updated', { 
        profilePicture: newPictureUrl 
      });
    },
    
    async signOut() {
      try {
        await axios.get(`${baseURL}/api/logout`, {
          withCredentials: true
        });
        console.log('Server logout successful');
      } catch (error) {
        console.error('Error logging out from server:', error);
      } finally {
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        window.dispatchEvent(new Event('userLoggedIn'));
        this.$router.push('/login');
      }
    },
    
    handleProfilePictureUpdate(event) {
      if (event.detail && event.detail.profilePicture) {
        // Update local profile picture
        this.profilePictureLocal = event.detail.profilePicture;
      }
    },

    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.showDropdown = false;
      }
    }
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
    
    // Listen for profile picture update events
    window.addEventListener('profile-picture-updated', this.handleProfilePictureUpdate);
    
    // Initial load
    this.loadUserData();
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    
    // Remove the event listener for profile updates
    window.removeEventListener('profile-picture-updated', this.handleProfilePictureUpdate);
  }
}
</script>
  
<style lang="css" scoped>
@import "./profilebutton.css";
</style>