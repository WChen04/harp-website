<template>
  <div class="post-card" @click="navigateToArticle">
    <img 
      :src="resolvedImageUrl" 
      alt="Article image" 
      class="post-image"  
    />
    <div class="post-info">
      <p class="post-date">{{ formatDate(date) }} • {{ read_time }}</p>
      <h3 class="post-title">{{ title }}</h3>
      <p class="post-intro">{{ intro }}</p>
      <button class="linkedin-btn">in</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  "Article ID": Number, 
  image_url: String,
  date: String,
  read_time: String,
  title: String,
  intro: String,
  link: String,
})

const resolvedImageUrl = computed(() => {
  return new URL(`../../../../assets/HARPResearchLockUps/Photos/${props.image_url.split('/').pop()}`, import.meta.url).href
})

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

const navigateToArticle = () => {
  if (props.link) {
    window.open(props.link, '_blank')
  }
}
</script>

<style scoped>
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
  object-fit: cover;
  border-radius: 8px;
  margin-right: 2em;
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

.linkedin-btn {
  background-color: #0077b5;
  color: white;
  padding: 0.3em 0.8em;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  align-self: start;
  margin-top: auto;
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