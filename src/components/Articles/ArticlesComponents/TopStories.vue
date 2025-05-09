<template>
  <section class="top-stories">
    <div class="carousel" v-if="articles.length > 0">
      <div 
        class="story" 
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
          v-if="resolveImageUrl(articles[currentStoryIndex])"
          :src="resolveImageUrl(articles[currentStoryIndex])" 
          alt="Story image"
          class="story-image"
        />
        <div v-else class="placeholder-image">No Image Available</div>
        <div class="delete-icon" v-if="isAdmin" @click.stop="toggleTopStory(articles[currentStoryIndex].id)">✖</div>
      </div>
    </div>
    <div v-else class="loading">Loading top stories...</div>
    <div class="dots" v-if="articles.length > 0">
      <span
        v-for="(article, index) in articles"
        :key="index"
        :class="{ active: index === currentStoryIndex }"
        @click="changeStory(index)"
      >•</span>
    </div>
  </section>
</template>

<script>
import { articleAPI } from '../ArticlesAPI/ArticlesAPI.js';
import { useAuthStore } from '../../../stores/auth';

export default {
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      articles: [],
      currentStoryIndex: 0,
      carouselInterval: null,
      loading: false,
      error: null
    };
  },
  computed: {
    isAdmin() {
      return this.authStore.isAdmin;
    }
  },
  methods: {
    resolveImageUrl(article) {
      console.log('Resolving image for article:', article);
      
      // Check if article exists
      if (!article) {
        console.warn('No article provided');
        return null;
      }

      // Check for existing imageUrl
      if (article.imageUrl) {
        console.log('Using existing imageUrl:', article.imageUrl);
        return article.imageUrl;
      }

      // Fallback to default or null
      console.warn('No image URL found for article:', article);
      return null;
    },
    formatDate(dateString) {
      if (!dateString) return 'No date available';
      
      try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
          return 'Invalid date';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error formatting date';
      }
    },
    async toggleTopStory(id){
      articleAPI.toggleTopStory(id)
      this.fetchArticles()
      console.log("Toggled Top Story")
    },
    navigateToArticle(article) {
      if (article && article.link) {
        window.open(article.link, '_blank');
      }
    },
    async fetchArticles() {
      this.loading = true;
      this.error = null;
      try {
        console.log('Fetching top stories...');
        const articles = await articleAPI.getTopStories();
        
        console.log('Raw top stories:', articles);
        
        // Fetch images for each top story
        const topStoriesWithImages = await Promise.all(
          articles.map(async (article) => {
            try {
              const imageUrl = await articleAPI.getArticleImage(article.id);
              console.log(`Image for article ${article.id}:`, imageUrl);
              return { ...article, imageUrl };
            } catch (error) {
              console.warn(`Could not fetch image for top story ${article.id}:`, error);
              return { ...article, imageUrl: null };
            }
          })
        );
        
        console.log('Top Stories with Images:', topStoriesWithImages);
        
        this.articles = topStoriesWithImages;
        
        // Reset carousel if needed
        if (this.articles.length > 0) {
          this.currentStoryIndex = 0;
          this.startCarousel();
        }
      } catch (error) {
        console.error('Error fetching top stories:', error);
        this.error = 'Failed to fetch top stories. Please try again later.';
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
    this.fetchArticles();
  },
  beforeUnmount() {
    this.stopCarousel();
  }
};
</script>

<style scoped>
.delete-icon {
  position: absolute;
  top: 1em;
  right: 1em;
  color: red;
}
.delete-icon:hover {
  color: darkred;
  transform: scale(1.2);
}
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
  position: relative;
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