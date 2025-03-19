<template>
  <section class="top-stories">
    <div class="carousel">
      <div 
        class="story" 
        v-if="articles.length > 0"
        @click="navigateToArticle(articles[currentStoryIndex])"
      >
        <div class="story-info">
          <p class="story-date">
            {{ formatDate(articles[currentStoryIndex].date) }} •
            {{ articles[currentStoryIndex].read_time }} 
          </p>
          <h2 class="story-title">{{ articles[currentStoryIndex].title }}</h2>
          <p class="story-intro">{{ articles[currentStoryIndex].intro }}</p>
        </div>
        <img
          :src="resolveImageUrl(articles[currentStoryIndex].image_url)" 
          alt="Story image"
          class="story-image"
        />
      </div>
      <div v-else>Loading...</div>
    </div>
    <div class="dots" v-if="articles.length > 0">
      <span
        v-for="(article, index) in articles"
        :key="index"
        :class="{ active: index === currentStoryIndex }"
        @click="changeStory(index)"
        >•
      </span>
    </div>
  </section>
</template>

<script>
import { articleAPI } from '../ArticlesAPI/ArticlesAPI.js';

export default {
  data() {
    return {
      articles: [],
      filteredArticles: [],
      articlesToShow: 3,
      loading: false,
      error: null,
      currentStoryIndex: 0,
      carouselInterval: null
    };
  },
  methods: {
    resolveImageUrl(imageUrl) {
      return new URL(`../../../../assets/HARPResearchLockUps/Photos/${imageUrl.split('/').pop()}`, import.meta.url).href
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },
    navigateToArticle(article) {
      if (article.link) {
        window.open(article.link, '_blank')
      }
    },
    async fetchArticles() {
      this.loading = true;
      this.error = null;
      try {
        const articles = await articleAPI.getTopStories();
        console.log('Fetched Top Stories:', articles);
        this.articles = articles;
        this.filteredArticles = articles;
      } catch (error) {
        this.error = 'Failed to fetch top stories. Please try again later.';
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    },
    startCarousel() {
      this.stopCarousel();
      this.carouselInterval = setInterval(() => {
        this.currentStoryIndex = (this.currentStoryIndex + 1) % this.articles.length;
      }, 5000);
    },
    stopCarousel() {
      if (this.carouselInterval) {
        clearInterval(this.carouselInterval);
      }
    },
    changeStory(index) {
      this.currentStoryIndex = index;
      this.startCarousel();
    }
  },
  mounted() {
    this.fetchArticles().then(() => {
      if (this.articles.length > 0) {
        this.startCarousel();
      }
    });
  },
  beforeUnmount() {
    this.stopCarousel();
  }
};
</script>

<style scoped>
.top-stories {
  position: relative;
  text-align: center;
  top: 10em;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2em;
}

.carousel {
  display: flex;
  overflow: hidden;
  border-radius: 2em;
  background: rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.story {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 100%;
  transition: transform 0.3s ease, opacity 0.5s ease;
  padding: 2em;
  justify-content: space-between;
  cursor: pointer;
  gap: 2em;
}

.story:hover {
  transform: scale(1.02);
}

.story-image {
  width: 500px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.story-info {
  color: white;
  text-align: left;
  flex: 1;
  min-width: 0;
}

.story-date {
  font-size: 0.9em;
  color: #a0a8b8;
  margin-bottom: 0.5em;
}

.story-title {
  font-size: 2em;
  font-weight: bold;
  margin: 0.2em 0;
  line-height: 1.2;
  transition: font-size 0.3s ease;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.story-intro {
  font-size: 1em;
  color: #c4c7d1;
  margin: 1em 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dots {
  margin-top: 1em;
}

.dots span {
  font-size: 1rem;
  cursor: pointer;
  margin: 0 0.5rem;
  color: #ccc;
  transition: color 0.3s ease;
}

.dots span.active {
  color: #ffffff;
}

/* Media Queries */
@media screen and (max-width: 1024px) {
  .story {
    padding: 1.5em;
  }

  .story-image {
    width: 400px;
    height: 250px;
  }

  .story-title {
    font-size: 1.8em;
  }
}

@media screen and (max-width: 768px) {
  .story {
    flex-direction: column-reverse;
    padding: 1.5em;
    gap: 1.5em;
  }

  .story-image {
    width: 100%;
    height: 300px;
  }

  .story-info {
    width: 100%;
  }

  .story-title {
    font-size: 1.6em;
  }

  .story-intro {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .top-stories {
    padding: 0 1em;
  }

  .carousel {
    border-radius: 1em;
  }

  .story {
    padding: 1em;
  }

  .story-image {
    height: 200px;
  }

  .story-title {
    font-size: 1.3em;
  }

  .story-intro {
    display: none;
  }

  .story-date {
    font-size: 0.8em;
  }
}
</style>