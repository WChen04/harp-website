import { createWebHistory, createRouter } from "vue-router";
import Home from "@/views/Home.vue";
import About from "@/views/About.vue";
import ViewPoint from "@/components/ViewPoint/ViewPoint.vue";
import Projects from "@/views/Projects.vue";
import Articles from "@/views/Articles.vue";
import Contact from "@/views/Contact.vue";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import ForgotPassword from '@/views/ForgotPassword.vue';
import ResetPassword from '@/views/ResetPassword.vue';
import Profile from '@/views/ProfilePictureUpload.vue';
import { useAuthStore } from "@/stores/auth";
import OpenSourceProject from "@/components/Projects/OpenSourceProject/OpenSourceProject.vue";
import ResearchProject from "@/components/Projects/ResearchProject/ResearchProject.vue";
import AASReroute from "@/views/AASReroute.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
  {
    path: "/viewpoint",
    name: "ViewPoint",
    component: ViewPoint,
  },
  {
    path: "/Projects",
    name: "Projects",
    component: Projects,
  },
  {
    path: "/articles",
    name: "Articles",
    component: Articles,
  },
  {
    path: "/contact",
    name: "Contact",
    component: Contact,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ForgotPassword,
  },
  {
    path: "/reset-password/:token",
    name: "ResetPassword",
    component: ResetPassword,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/open-source-project",
    name: "OpenSourceProject",
    component: OpenSourceProject,
  },
  {
    path: "/research-project",
    name:"ResearchProject",
    component: ResearchProject,
  },
  {
    path: "/AASreroute",
    name:"AASreroute",
    component: AASReroute,
  },
 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition; 
    } else {
      return { top: 0 }; 
    }
    return { top: 0 };
  },
});
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // If going to admin routes, check if user is admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/');
  }
  
  // If going to authenticated routes, check if user is authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }
  
  next();
});


export default router;
