<script setup>
import Nav from "./components/General/Nav.vue";
import { useAuthStore } from './stores/auth.js';
import { onMounted } from 'vue';

const authStore = useAuthStore();
  
onMounted(async () => {
  // Fetch user information when the app loads
  await authStore.fetchCurrentUser();
});
</script>

<template>
  <header>
    <Nav />
  </header>

  <main>
    <router-view></router-view>
  </main>
</template>

<style lang="css" scoped></style>
