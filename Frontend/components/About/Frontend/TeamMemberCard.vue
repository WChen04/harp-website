<template>
  <div class="member">
    <div class="member-card">
      <div class="card front">
        <div v-if="isImageLoading" class="image-skeleton">
          <div class="skeleton-loader"></div>
        </div>
        <img
          v-show="!isImageLoading"
          :src="imageUrl"
          :alt="`${member.name}'s profile image`"
          loading="lazy"
          @load="onImageLoad"
          @error="onImageError"
        />
        <div class="member-box"></div>
      </div>
      <div class="card back">
        <div class="member-box"></div>
        <a
          class="logo"
          :href="member.github_url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="../../../assets/SocialMediaIcons/github.png"
            alt="GitHub Logo"
          />
        </a>
        <a
          class="logo"
          :href="member.linkedin_url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="../../../assets/SocialMediaIcons/linkedin.png"
            alt="LinkedIn Logo"
          />
        </a>
      </div>
    </div>
    <h4 class="member-name">{{ member.name }}</h4>
    <h5 class="member-role">{{ member.role }}</h5>
    <div v-if="userIsAdmin" class="team-card-actions">
      <button @click="editMember" class="edit-btn">Edit</button>
      <button @click="confirmDelete" class="delete-btn">Delete</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useAuthStore } from '../../../stores/auth.js';

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit', 'delete']);

const authStore = useAuthStore();
const imageUrl = ref('');
const isImageLoading = ref(true);
// Add a timestamp to force image cache refresh when needed
const imageTimestamp = ref(Date.now());

const userIsAdmin = computed(() => {
  return authStore.isAdmin;
});

function editMember() {
  emit('edit', props.member);
}

function confirmDelete() {
  emit('delete', props.member.id);
}

// Generate the URL with optimized caching
function generateImageUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Remove cache-busting for better caching, use version-based cache invalidation instead
  return `${apiUrl}/api/team-member-image/${props.member.id}`;
}

// Image loading handlers
function onImageLoad() {
  isImageLoading.value = false;
}

function onImageError() {
  isImageLoading.value = false;
  // Fallback to a default image if loading fails
  imageUrl.value = '../../../assets/Photos/profile.png';
}

// Fetch the team member image
async function fetchMemberImage() {
  try {
    isImageLoading.value = true;
    imageUrl.value = generateImageUrl();
  } catch (error) {
    console.error("Error generating team member image URL:", error);
    onImageError();
  }
}

// Watch for changes in member data to refresh the image when needed
watch(() => props.member, (newVal, oldVal) => {
  // Check if the member ID changed or if we're showing the same member but need to refresh
  if (newVal.id !== oldVal?.id || newVal !== oldVal) {
    // Update timestamp to bust cache
    imageTimestamp.value = Date.now();
    // Refresh the image
    fetchMemberImage();
  }
}, { deep: true });

onMounted(() => {
  fetchMemberImage();
});
</script>


<style lang="css" scoped>
/* Style remains the same */
.member {
  margin-bottom: 3%;
  margin-top: 3%;
  display: flex;
  flex-direction: column;
  align-items: center;
  perspective: 1000px;
}

.member-card {
  width: 15rem;
  height: 15rem;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  margin-bottom: 1rem;
}

.card {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10%;
  padding: 1rem;
  color: white;
}

/* Changes the gradient of each team members' card */
.front {
  background: linear-gradient(to bottom, #54204d 0%, #7db9e8 100%);
  overflow: hidden;
}
.front img {
    width: 30rem;
    height: 30rem;
    object-fit: cover;
}

.back {
  background: #7db9e8;
  display: flex;
  flex-direction: row;
  transform: rotateY(-180deg);
  color: black;
}
.back img {
  height: 3rem;
  width: 3rem;
  margin: 1rem;
}
.member-card:hover {
  transform: rotateY(-180deg);
}
.member-name {
  font-weight: bold;
  font-size: 1.1rem;
}

/* Add styles for the action buttons */
.team-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.edit-btn {
  background-color: #4a90e2;
  color: white;
}

.edit-btn:hover {
  background-color: #3a7bc8;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
}

/* Image loading skeleton */
.image-skeleton {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-loader {
  width: 80%;
  height: 80%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 50%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>