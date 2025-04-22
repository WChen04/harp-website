<template>
  <div class="Projects">
    <Header
      title="Projects"
      subtitle="We deliver next-gen AI solutions that drive innovation and unlock new possibilities"
    />
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-bar-wrapper">
        <img 
          src="https://img.icons8.com/?size=100&id=DZe3wFKTc8IK&format=png&color=000000" 
          alt="Search Icon" 
          class="search-icon"
        />        
        <input v-model="searchQuery" type="text" placeholder="Search by name or category" class="search-bar" />
      </div>
    </div>
    <!-- Tags and Filter -->
    <div class="tags-container">
      <button 
        v-for="tag in availableTags" 
        :key="tag" 
        @click="toggleTag(tag)" 
        :class="{ active: selectedTags.includes(tag) }"
      >
        {{ tag }}
      </button>
    </div>

    <div class="grid-container">
      <div 
        class="grid-item" 
        v-for="project in filteredProjects" 
        :key="project.id"
      >
        <ProjectCard :project="project" />
      </div>
    </div>

    <StayInTheLoop />
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from 'axios';
import Header from "@/components/General/Header.vue";
import StayInTheLoop from "@/components/General/StayInTheLoop.vue";
import Footer from "@/components/General/Footer.vue";
import ProjectCard from "@/components/Projects/ProjectCard.vue";

const searchQuery = ref("");
const selectedTags = ref([]);
const availableTags = ["Open Source", "Research"];
const projects = ref([]);

async function fetchProjects() {
  try {
    const response = await axios.get(`http://localhost:3000/api/projects`);
    console.log("Fetched projects:", response.data); // Log fetched data
    projects.value = response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
  }
}

onMounted(() => {
  fetchProjects();
});

const filteredProjects = computed(() => {
  const filtered = projects.value.filter((project) => {
    const query = searchQuery.value.toLowerCase();
    
    // Check if search query matches the project name or type
    const matchesSearch =
      project.name.toLowerCase().includes(query) ||
      (project.type && project.type.toLowerCase().includes(query));

    // Check if project matches selected tags
    const matchesTags = selectedTags.value.length === 0 || 
      (project.type && selectedTags.value.includes(project.type));

    return matchesSearch && matchesTags;
  });

  console.log("Filtered projects:", filtered); // Log filtered projects
  return filtered;
});

const toggleTag = (tag) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(t => t !== tag);
  } else {
    selectedTags.value.push(tag);
  }
};
</script>

<style scoped>
@import "../components/Projects/project.css";

</style>

