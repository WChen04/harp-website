<script>
import GetStarted from "./GetStarted.vue";
import ProfileButton from "../Profile/ProfileButton.vue";
import axios from "axios";
import { useAuthStore } from '../../stores/auth.js';

export default {
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  name: "Nav",
  components: {
    GetStarted,
    ProfileButton,
  },
  data() {
    return {
      showProductsDropdown: false,
      isScrolled: false,
      currentUser: null,
      isAdmin: false,
    };
  },

  created() {
    // Check auth status when component is created
    this.checkAuthStatus();

    // Check URL parameters for OAuth redirect with userData
    this.checkOAuthRedirect();
  },

  computed: {
    userIsAdmin() {
      console.log("Nav.vue isAdmin check: ", this.authStore.isAdmin);
      return this.authStore.isAdmin;
    },
    currentUserFromStore() {
      return this.authStore.user;
    } 
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
      const userData = urlParams.get("userData");

      if (userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem("user", JSON.stringify(user));

          // Update current user
          this.currentUser = user;

          // Dispatch event to notify components
          window.dispatchEvent(new Event("userLoggedIn"));

          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } catch (error) {
          console.error("Error parsing user data from redirect:", error);
        }
      }
    },

    updateProfilePicture(newPictureUrl) {
      if (this.currentUser) {
        this.currentUser.profile_picture = newPictureUrl;

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(this.currentUser));
      }
    },

    onProfilePictureUpdate(newPictureUrl) {
      if (this.currentUser) {
        this.currentUser.profile_picture = newPictureUrl;

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(this.currentUser));
      }
    },

    async checkAuthStatus() {
      await this.authStore.checkAuthStatus();
      this.currentUser = this.authStore.user;
    }
  },

  mounted() {
    // Add scroll event listener when component is mounted
    window.addEventListener("scroll", this.handleScroll);
    // Listen for login event
    window.addEventListener("userLoggedIn", this.checkAuthStatus);
    // Listen for storage changes
    window.addEventListener("storage", this.checkAuthStatus);
  },

  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("userLoggedIn", this.checkAuthStatus);
    window.removeEventListener("storage", this.checkAuthStatus);
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
            <router-link class="dropdown-link" to="/viewpoint"
              >ViewPoint</router-link
            >
          </div>
        </div>
        <!-- <router-link class="navLink" to="/projects">Projects</router-link>-->
        <router-link class="navLink" to="/articles">Articles</router-link>
        <div v-if="userIsAdmin">
          <router-link class="navLink" to="/admin/users">Admin Status</router-link>
        </div>
      </div>
      <div class="nav-right">
        <router-link class="navLink" to="/contact">Contact Us</router-link>
        <template v-if="currentUser && currentUser.full_name">
          <profile-button
            :fullName="currentUser.full_name"
            :profilePicture="currentUser.profile_picture"
            @update:profilePicture="onProfilePictureUpdate"
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
