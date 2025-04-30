import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../../utils/authClient";

// Views
import Home from "@/views/Home.vue";
import About from "@/views/About.vue";
import Projects from "@/views/Projects.vue";
import Articles from "@/views/Articles.vue";
import Contact from "@/views/Contact.vue";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import ResetPassword from "@/views/ResetPassword.vue";
import Profile from "@/views/ProfilePictureUpload.vue";
import AdminStatus from "@/views/AdminStatus.vue";
import AASReroute from "@/views/AASReroute.vue";

// Components
import ViewPoint from "@/components/ViewPoint/ViewPoint.vue";
import OpenSourceProject from "@/components/Projects/OpenSourceProject/OpenSourceProject.vue";
import ResearchProject from "@/components/Projects/ResearchProject/ResearchProject.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/about", name: "About", component: About },
  { path: "/viewpoint", name: "ViewPoint", component: ViewPoint },
  { path: "/projects", name: "Projects", component: Projects },
  { path: "/articles", name: "Articles", component: Articles },
  { path: "/contact", name: "Contact", component: Contact },
  { path: "/register", name: "Register", component: Register },
  { path: "/login", name: "Login", component: Login },
  { path: "/forgot-password", name: "ForgotPassword", component: ForgotPassword },
  { path: "/reset-password/:token", name: "ResetPassword", component: ResetPassword },
  { path: "/profile", name: "Profile", component: Profile },
  { path: "/admin/users", name: "AdminStatus", component: AdminStatus, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: "/open-source-project", name: "OpenSourceProject", component: OpenSourceProject },
  { path: "/research-project", name: "ResearchProject", component: ResearchProject },
  { path: "/aasreroute", name: "AASReroute", component: AASReroute },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  }
});

// Route Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "Login", query: { redirect: to.fullPath } });
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: "Home" });
  }

  next();
});

export default router;
