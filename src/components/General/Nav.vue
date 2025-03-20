<script>
import GetStarted from "./GetStarted.vue";
import ProfileButton from "../Profile/ProfileButton.vue";
import axios from 'axios';

export default {
  name: 'Nav',
  components: { 
    GetStarted, 
    ProfileButton 
  },
  data() {
    return {
      showProductsDropdown: false,
      isScrolled: false,
      currentUser: null
    };
  },

  created() {
    // Check auth status when component is created
    this.checkAuthStatus();

    // Check URL parameters for OAuth redirect with userData
    this.checkOAuthRedirect();
  },

  methods: {
    toggleProductsDropdown() {
      this.showProductsDropdown = !this.showProductsDropdown;
    },
    handleScroll() {
      this.isScrolled = window.scrollY > 100;
    },
    checkOAuthRedirect() {
      const urlParams = new URLSearchParams(window.location.search);
      const userData = urlParams.get('userData');
      
      if (userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update current user
          this.currentUser = user;
          
          // Dispatch event to notify components
          window.dispatchEvent(new Event('userLoggedIn'));
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error parsing user data from redirect:', error);
        }
      }
    },
    
    async checkAuthStatus() {
      // First check localStorage (for regular login)
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          this.currentUser = JSON.parse(userData);
          //console.log('User found in localStorage:', this.currentUser);
          return;
        }
      } catch (error) {
        console.error('Error checking auth status from localStorage:', error);
      }
      
      // If no user in localStorage, check session (for OAuth)
      try {
        const response = await axios.get('http://localhost:3000/api/user', {
          withCredentials: true // Important for cookies/session
        });
        
        if (response.data && response.data.email) {
          // We have a logged-in user via session
          this.currentUser = response.data;
          
          // Store in localStorage for consistency
          localStorage.setItem('user', JSON.stringify(response.data));
          console.log('User found from session:', this.currentUser);
        } else {
          this.currentUser = null;
          console.log('No authenticated user found');
        }
      } catch (error) {
        // 401 error is expected if not authenticated
        if (error.response && error.response.status !== 401) {
          console.error('Error checking session auth status:', error);
        }
        this.currentUser = null;
      }
    }
  },

  mounted() {
    // Add scroll event listener when component is mounted
    window.addEventListener('scroll', this.handleScroll);
    // Listen for login event
    window.addEventListener('userLoggedIn', this.checkAuthStatus);
    // Listen for storage changes
    window.addEventListener('storage', this.checkAuthStatus);
  },
  
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('userLoggedIn', this.checkAuthStatus);
    window.removeEventListener('storage', this.checkAuthStatus);
  },
};
</script>

<template>
  <div>
    <nav :class="{ scrolled: isScrolled }">
      <div class="nav-left">
        <router-link class="navLink" to="/">
          <img
            src="../../assets/HARPResearchLockUps/LogoLockups/HARP Logo Shirt Res.svg"
            alt="HARP Logo"
            class="logo"
          />
        </router-link>
        <router-link class="navLink" to="/about">About</router-link>
        <div class="navLink products" @click="toggleProductsDropdown">
          Products
          <div v-if="showProductsDropdown" class="dropdown">
            <router-link class="dropdown-link" to="/viewpoint">ViewPoint</router-link>
          </div>
        </div>
        <router-link class="navLink" to="/projects">Projects</router-link>
        <router-link class="navLink" to="/articles">Articles</router-link>
      </div>
      <div class="nav-right">
        <router-link class="navLink" to="/contact">Contact Us</router-link>
        <template v-if="currentUser && currentUser.full_name">
          <profile-button 
            :fullName="currentUser.full_name" 
            :profilePicture.sync="currentUser.profile_picture" 
          />
        </template>
        <template v-else>
          <router-link class="navLink" to="/login">
            <get-started></get-started>
          </router-link>
        </template>
      </div>
    </nav>
  </div>
</template>

<style lang="css" scoped>
@import "./nav.css";
</style>
