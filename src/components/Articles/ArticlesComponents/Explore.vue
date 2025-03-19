<template>
  <section class="explore">
    <div class="explore-top">
      <h2 id="exploreword">Explore</h2>
      <div class="search-bar">
        <input
          type="text"
          placeholder="Browse..."
          v-model="searchQuery"
          @input="filterArticles"
        />
        <button @click="filterArticles">
          <span class="arrow">→</span>
        </button>
      </div>
    </div>
    <div class="posts">
      <PostCard
        v-for="(post, index) in displayedArticles"
        :key="post['Article ID']"
        v-bind="post"
      />
    </div>
    <button v-if="canLoadMore" @click="loadMore" class="load-more-btn">
      Load more
    </button>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </section>
</template>

<script>
import PostCard from "./PostCard.vue";
import { articleAPI } from '../ArticlesAPI/ArticlesAPI.js';

export default {
  components: { PostCard },
  data() {
    return {
      searchQuery: "",
      articles: [],
      filteredArticles: [],
      articlesToShow: 3,
      loading: false,
      error: null
    };
  },
  computed: {
    displayedArticles() {
      return this.filteredArticles.slice(0, this.articlesToShow);
    },
    canLoadMore() {
      return this.articlesToShow < this.filteredArticles.length;
    },
  },
  methods: {
    async fetchArticles() {
  this.loading = true;
  this.error = null;
  try {
    const articles = await articleAPI.getArticles();
    console.log('Fetched articles:', articles); // Add this line
    this.articles = articles;
    this.filteredArticles = articles;
  } catch (error) {
    this.error = 'Failed to fetch articles. Please try again later.';
    console.error('Error:', error);
  } finally {
    this.loading = false;
  }
},
    async filterArticles() {
      this.loading = true;
      this.error = null;
      try {
        if (this.searchQuery.trim()) {
          const results = await articleAPI.searchArticles(this.searchQuery);
          this.filteredArticles = results;
        } else {
          this.filteredArticles = this.articles;
        }
        this.articlesToShow = 3;
      } catch (error) {
        this.error = 'Search failed. Please try again.';
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    },
    loadMore() {
      this.articlesToShow += 3;
    },
  },
  async mounted() {
    await this.fetchArticles();
  },
};
</script>

<style scoped>
.explore {
  text-align: left;
  padding: 1em;
  color: #ffffff;
  margin-top: 10em;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}
#exploreword {
  font-size: 2em;
  font-weight: bold;
  margin: 0; /* Remove default margins */
}
.explore-top {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 2em;
  padding: 0; /* Remove any padding */
}

h2 {
  font-size: 2em;
  margin-bottom: 1em;
}

.search-bar {
  display: flex;
  align-items: center;
  border-radius: 2em;
  overflow: hidden;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  background-color: #ffffff;
  width: 40%;
  margin: 0; /* Remove margins */
}

.search-bar input {
  flex: 1;
  padding: 0.8em;
  border: none;
  font-size: 1em;
  outline: none;
}

.search-bar button {
  background: linear-gradient(90deg, #3a8de1, #5f76f3); /* Gradient */
  color: white;
  padding: 0.5em 2em;
  border: none;
  border-radius: 2em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1em;
}

.arrow {
  font-size: 1.5em;
  font-weight: bold;
}
.posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 1.5em;
}
.post-card {
  display: flex;
  align-items: flex-start;
  border-radius: 8px;
  color: white;
  padding: 2em;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  cursor: pointer;
  transition: transform 0.3s ease;
  background: rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.load-more-btn {
  background-color: #444; /* Change color to a neutral gray */
  color: white;
  padding: 0.8em 1.5em;
  font-size: 1em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 1.5em auto 0; /* Centers the button horizontally */
  display: block; /* Ensures the button takes up only its content width */
}
.loading {
  text-align: center;
  padding: 1em;
  color: #ffffff;
}

.error {
  text-align: center;
  padding: 1em;
  color: #ff4444;
  background-color: rgba(255, 68, 68, 0.1);
  border-radius: 4px;
  margin: 1em 0;
}

@media screen and (max-width: 9999px){
  .explore {
    padding: 2em;
  }
}

@media screen and (max-width: 1024px) {
  .explore {
    padding: 2em;
  }
  
  .post-card {
    padding: 2em;
  }
}

@media screen and (max-width: 768px) {
  .explore {
    padding: 2.5em;
  }
  
  
}

@media screen and (max-width: 480px) {
  .explore, .post-card {
    padding: 1em;
  }
  .explore-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;
  }

  .search-bar {
    width: 100%;
  }

  .post-card {
    padding: 1em;
  }
}
</style>
