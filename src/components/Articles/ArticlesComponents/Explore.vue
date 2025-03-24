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
      <button v-if="isAdmin" @click="showAddModal = true" class="add-article-btn">
        Add Article
      </button>
    </div>
    <div class="posts">
      <PostCard
        v-for="(post, index) in displayedArticles"
        :key="post['Article ID']"
        :article-id="post['Article ID']"
        :image_url="post.image_url"
        :date="post.date"
        :read_time="post.read_time"
        :title="post.title"
        :intro="post.intro"
        :link="post.link"
        :top-story="post.TopStory"
      />
    </div>
    <button v-if="canLoadMore" @click="loadMore" class="load-more-btn">
      Load more
    </button>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Add New Article</h2>
        <form @submit.prevent="submitArticle" class="article-form">
          <!-- Title -->
          <div class="form-group">
            <label for="title">Title</label>
            <input 
              type="text" 
              id="title" 
              v-model="newArticle.title" 
              required
            />
          </div>
          
          <!-- Intro -->
          <div class="form-group">
            <label for="intro">Introduction</label>
            <textarea 
              id="intro" 
              v-model="newArticle.intro" 
              rows="3" 
              required
            ></textarea>
          </div>
          
          <!-- Date -->
          <div class="form-group">
            <label for="date">Date (YYYY-MM-DD)</label>
            <input 
              type="date" 
              id="date" 
              v-model="newArticle.date" 
              required
            />
          </div>
          
          <!-- Read Time -->
          <div class="form-group">
            <label for="readTime">Read Time (e.g., "5 min")</label>
            <input 
              type="text" 
              id="readTime" 
              v-model="newArticle.read_time" 
              placeholder="5 min" 
              required
            />
          </div>
          
          <!-- Link -->
          <div class="form-group">
            <label for="link">Article Link (URL)</label>
            <input 
              type="url" 
              id="link" 
              v-model="newArticle.link" 
              placeholder="https://example.com/article" 
              required
            />
          </div>
          
          <!-- Image Upload -->
          <div class="form-group">
            <label for="image">Image</label>
            <input 
              type="file" 
              id="image" 
              @change="handleImageUpload" 
              accept="image/*" 
              required
            />
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="Preview" />
            </div>
          </div>
          
          <!-- Top Story -->
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="topStory" 
              v-model="newArticle.TopStory"
            />
            <label for="topStory">Featured as Top Story</label>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Add Article' }}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      error: null,
      isAdmin: false, // You'll set this based on user session
      showAddModal: false,
      submitting: false,
      imagePreview: null,
      newArticle: {
        title: '',
        intro: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        read_time: '',
        link: '',
        TopStory: false,
        image: null, // Will hold the file object
        imageBase64: '' // Will hold base64 string
      }
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
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      this.newArticle.image = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target.result;
        this.newArticle.imageBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    async submitArticle() {
      if (!this.newArticle.title || !this.newArticle.intro || !this.newArticle.image) {
        this.error = 'Please fill out all required fields';
        return;
      }
      
      this.submitting = true;
      this.error = null;
      
      try {
        // Create FormData for multipart/form-data submission
        const formData = new FormData();
        formData.append('title', this.newArticle.title);
        formData.append('intro', this.newArticle.intro);
        formData.append('date', this.newArticle.date);
        formData.append('read_time', this.newArticle.read_time);
        formData.append('link', this.newArticle.link);
        formData.append('TopStory', this.newArticle.TopStory);
        formData.append('image', this.newArticle.image);
        
        // For the base64 option instead of file upload
        // formData.append('imageBase64', this.newArticle.imageBase64);
        
        // Submit to API
        const result = await articleAPI.addArticle(formData);
        
        // Close modal and refresh articles
        this.showAddModal = false;
        this.resetNewArticle();
        await this.fetchArticles();
        
        // Optionally show success message
        alert('Article added successfully!');
        
      } catch (error) {
        this.error = 'Failed to add article. Please try again.';
        console.error('Error:', error);
      } finally {
        this.submitting = false;
      }
    },
    resetNewArticle() {
      this.newArticle = {
        title: '',
        intro: '',
        date: new Date().toISOString().split('T')[0],
        read_time: '',
        link: '',
        TopStory: false,
        image: null,
        imageBase64: ''
      };
      this.imagePreview = null;
    },
    checkAdminStatus() {
      // Get user from session/storage and check if admin
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.isAdmin = user.is_admin === true;
      console.log("Admin Status: ", this.isAdmin);
    }
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
.actions {
  display: flex;
  align-items: center;
  gap: 1em;
}

.add-article-btn {
  background: linear-gradient(90deg, #4CAF50, #45a049);
  color: white;
  padding: 0.8em 1.5em;
  border: none;
  border-radius: 2em;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.add-article-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1e2333;
  border-radius: 8px;
  padding: 2em;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  color: white;
}

.article-form {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="date"],
.form-group textarea {
  padding: 0.8em;
  border-radius: 4px;
  border: 1px solid #3a4052;
  background-color: #2a2f40;
  color: white;
}

.form-group input[type="file"] {
  padding: 0.5em 0;
}

.image-preview {
  margin-top: 0.5em;
  max-width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  max-width: 100%;
  height: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1em;
  margin-top: 1em;
}

.cancel-btn {
  background-color: #3a4052;
  color: white;
  padding: 0.8em 1.5em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(90deg, #3a8de1, #5f76f3);
  color: white;
  padding: 0.8em 1.5em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #3a4052;
  cursor: not-allowed;
}

@media screen and (max-width: 768px) {
  .explore-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;
  }
  
  .actions {
    width: 100%;
    flex-direction: column;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .add-article-btn {
    width: 100%;
  }
}
</style>
