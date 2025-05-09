<template>
  <div class="post-card" @click="navigateToArticle">
    <div v-if="imageUrl" class="post-image">
      <img :src="imageUrl" :alt="title" />
    </div>
    <div class="post-info">
      <p class="post-date">{{ formatDate(date) }} • {{ read_time }}</p>
      <h3 class="post-title">{{ title }}</h3>
      <p class="post-intro">{{ intro }}</p>
    </div>
    <div class="delete-icon" v-if="isAdmin" @click.stop="deleteArticle">✖</div>
    <div class="upgrade-top" v-if="isAdmin" @click.stop="toggleTopStory">⬆️</div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import { useAuthStore } from '../../../stores/auth'; 
import { articleAPI } from '../ArticlesAPI/ArticlesAPI.js';

const authStore = useAuthStore();
const emit = defineEmits(['delete-article'])
const props = defineProps({
  articleId: Number,  // Changed from "Article ID"
  imageUrl: {
      type: String,
      default: null
    },
  date: String,
  read_time: String,
  title: String,
  intro: String,
  link: String,
  topStory: Boolean,
  isAdmin: Boolean,
})
const isAdmin = computed(() => {
    return authStore.isAdmin;
})
const deleteArticle = () => {
  if (confirm("Are you sure you want to delete this article?")) {
    emit('delete-article', props.articleId)
  }
}
async function toggleTopStory() {
  try {
    await articleAPI.toggleTopStory(props.articleId);
    console.log("Toggled Top Story");
    // You can also update local state here if needed
  } catch (error) {
    console.error('Failed to toggle top story:', error);
  }
}
const resolvedImageUrl = computed(() => {
  if (!props.image_url) {
    return ''; // Or a default image URL
  }
  
  try {
    return new URL(
      `../../../assets/HARPResearchLockUps/Photos/${props.image_url.split('/').pop()}`, 
      import.meta.url
    ).href;
  } catch (error) {
    console.error('Error resolving image URL:', error);
    return ''; // Or a default image URL
  }
})

const formatDate = (dateString) => {
  if (!dateString) return 'No date'; // Handle null/undefined case
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid date value:', dateString);
      return 'Invalid date';
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Error';
  }
}
const navigateToArticle = () => {
  if (props.link) {
    window.open(props.link, '_blank')
  }
}
</script>

<style scoped>
.delete-icon {
  color: red
}
.post-card {
  display: flex;
  align-items: flex-start;
  border-radius: 8px;
  color: white;
  padding: 2em;
  width: 100%; /* Changed from 90% to 100% */
  max-width: 1400px; /* Match top-stories max-width */
  margin: 0 auto;
  cursor: pointer;
  transition: transform 0.3s ease;
  background: rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.post-card:hover {
  transform: scale(1.02);
}

.post-image {
  width: 40%;
  height: 300px;
  border-radius: 8px;
  margin-right: 2em;
  overflow: hidden; /* Ensures the image is clipped to the div's boundaries */
}

.post-image img {
  width: 100%; 
  height: 100%; 
  object-fit: cover; /* Ensures image covers entire div while maintaining aspect ratio */
  object-position: center; /* Centers the image */
}

.post-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevents flex items from overflowing */
}

.post-date {
  font-size: 0.9em;
  color: #a0a8b8;
  margin-bottom: 0.5em;
}

.post-title {
  font-size: 2em;
  font-weight: bold;
  margin: 0.2em 0;
  line-height: 1.2;
  color: #ffffff;
  transition: font-size 0.3s ease;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.post-intro {
  font-size: 1em;
  color: #c4c7d1;
  margin: 1em 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Media Queries */
@media screen and (max-width: 1024px) {
  .post-card {
    padding: 1.5em;
    width: 95%;
  }

  .post-title {
    font-size: 1.8em;
  }

  .post-image {
    height: 250px;
  }
}

@media screen and (max-width: 768px) {
  .post-card {
    flex-direction: column;
    padding: 1em;
  }

  .post-image {
    width: 100%;
    height: 200px;
    margin: 0 0 1em 0;
  }

  .post-title {
    font-size: 1.5em;
    width: 100%;
  }

  .post-intro {
    -webkit-line-clamp: 2;
  }
}

@media screen and (max-width: 480px) {
  .post-card {
    width: 100%;
    border-radius: 0;
  }

  .post-image {
    height: 180px;
  }

  .post-title {
    font-size: 1.3em;
  }

  .post-intro {
    display: none;
  }

  .post-date {
    font-size: 0.8em;
  }
}
</style>