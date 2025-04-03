<template>
  <div class="Projects">
    <Header
      title="Projects"
      subtitle="We deliver next-gen AI solutions that drive innovation and unlock new possibilities"
    />

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
        <router-link :to="project.link" class="project-link">
          <div class="project-card">
            <div class="card front">
              <div class="member-box"></div>
              <h4 class="project-name">{{ project.name }}</h4>
              <div class="tags" v-if="selectedTags.length">
                <span v-for="tag in project.tags" :key="tag" v-show="selectedTags.includes(tag)">{{ tag }}</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <StayInTheLoop />
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Header from "@/components/General/Header.vue";
import StayInTheLoop from "@/components/General/StayInTheLoop.vue";
import Footer from "@/components/General/Footer.vue";

const searchQuery = ref("");
const selectedTags = ref([]);
const availableTags = ["Open Source", "Research"];

const ProjectCards = [
  { id: 1, name: "Vox-Intuitus", link: "/open-source-project", tags: ["AI", "Open Source"] },
  { id: 2, name: "GenGraph", link: "/open-source-project", tags: ["Web", "Data Science"] },
  { id: 3, name: "Xavier-One", link: "/open-source-project", tags: ["AI", "Data Science"] },
  { id: 4, name: "IntelliFabric", link: "/open-source-project", tags: ["Open Source", "Web"] },
  { id: 5, name: "DSP-OS 2", link: "/open-source-project", tags: ["AI", "Open Source"] },
  { id: 7, name: "Ad Apt", link: "/open-source-project", tags: ["Web", "AI"] },
];

const filteredProjects = computed(() => {
  return ProjectCards.filter((project) => {
    const query = searchQuery.value.toLowerCase();
    
    // Check if search query matches the project name or any of its tags
    const matchesSearch =
      project.name.toLowerCase().includes(query) ||
      project.tags.some(tag => tag.toLowerCase().includes(query));

    // Check if project matches selected tags
    const matchesTags = selectedTags.value.length === 0 || 
      project.tags.some(tag => selectedTags.value.includes(tag));

    return matchesSearch && matchesTags;
  });
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

