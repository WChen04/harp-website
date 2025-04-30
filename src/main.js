import "./assets/CSS/main.css";

import { createApp } from "vue";
import {createPinia } from 'pinia'
import router from "./router";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia)

import { useAuthStore } from '../utils/authClient'
const authStore = useAuthStore()
authStore.checkAuthStatus().finally(() => {
  // Mount app after checking auth
  app.use(router)
  app.mount('#app')
})

