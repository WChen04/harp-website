<template>
  <div class="profile-picture-upload">
    <h3>Change Profile Picture</h3>
    
    <div class="current-picture">
      <!-- Show preview of the new image if available -->
      <img 
        v-if="currentPreview" 
        :src="currentPreview" 
        alt="Preview" 
        class="preview-image"
      />
      <!-- Show current profile picture if no preview -->
      <img 
        v-else-if="currentPicture" 
        :src="currentPicture" 
        alt="Current profile picture" 
        class="preview-image"
      />
      <!-- Fallback if no image is available -->
      <div v-else class="no-picture">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <p>No profile picture set</p>
      </div>
    </div>
    
    <div v-if="selectedFile" class="selected-file">
      Selected file: {{ selectedFile.name }}
    </div>
    
    <div class="upload-controls">
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileChange" 
        accept="image/jpeg, image/png, image/gif" 
        class="file-input"
      />
      
      <button 
        @click="triggerFileInput" 
        class="select-button"
      >
        Select Image
      </button>
      
      <button 
        v-if="selectedFile" 
        @click="uploadPicture" 
        class="upload-button"
        :disabled="uploading"
      >
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="success" class="success-message">
      {{ success }}
    </div>
  </div>
</template>

<script>
import apiClient from '../../utils/axios-config.js';

export default {
  data() {
    return {
      currentPicture: null,
      currentPreview: null,
      selectedFile: null,
      uploading: false,
      error: null,
      success: null
    };
  },
  
  mounted() {
    // Always fetch from API to ensure we have the latest data
    this.fetchUserProfile();
  },
  
  methods: {
    async fetchUserProfile() {
      try {
        const response = await apiClient.get('/api/me'); // no need for baseURL again
        const userData = response.data;

        console.log('User data fetched:', userData);
        console.log('User Picture:', userData.profile_picture);

        if (userData.profile_picture) {
          this.currentPicture = userData.profile_picture;

          // Update localStorage
          const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
          storedData.profile_picture = userData.profile_picture;
          localStorage.setItem('userData', JSON.stringify(storedData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    handleFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Reset previous states
      this.error = null;
      this.success = null;
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.error = 'File size must be less than 2MB';
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Only JPEG, PNG, and GIF files are allowed';
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
        return;
      }
      
      this.selectedFile = file;
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    async uploadPicture() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.error = null;
      this.success = null;

      try {
        const formData = new FormData();
        formData.append('profilePicture', this.selectedFile);

        console.log('Starting upload...');

        const response = await apiClient.post('/api/profile/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const data = response.data;
        console.log('Upload response:', data);

        // Update displayed picture
        this.currentPicture = data.profilePicture;
        this.currentPreview = null;

        // Update stored user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.profile_picture = data.profilePicture;
        localStorage.setItem('userData', JSON.stringify(userData));

        // Also update the user object in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.profile_picture = data.profilePicture;
        localStorage.setItem('user', JSON.stringify(user));

        // Reset file input
        this.selectedFile = null;
        this.$refs.fileInput.value = '';

        // Display success message
        this.success = 'Profile picture updated successfully!';

        // Emit event for parent components
        this.$emit('picture-updated', data.profilePicture);

        // Trigger global event
        window.dispatchEvent(new CustomEvent('profile-picture-updated', {
          detail: { profilePicture: data.profilePicture }
        }));

      } catch (error) {
        console.error('Upload error:', error);
        this.error = error.response?.data?.error || error.message || 'Failed to upload profile picture';
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>

<style scoped>
.profile-picture-upload {
  margin: 0;
  padding: 15px;
  border-radius: 8px;
  background-color: #fff;
  color: #333;
}

.current-picture {
  margin: 15px 0;
  display: flex;
  justify-content: center;
}

.preview-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e9ecef;
}

.no-picture {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6c757d;
}

.selected-file {
  text-align: center;
  margin: 10px 0;
  color: #495057;
}

.upload-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.file-input {
  display: none;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.select-button {
  background-color: #e9ecef;
  color: #495057;
}

.upload-button {
  background-color: #007bff;
  color: white;
}

.upload-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  text-align: center;
}

.success-message {
  color: #28a745;
  margin-top: 10px;
  text-align: center;
}
</style>