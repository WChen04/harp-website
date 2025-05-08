<template>
  <div class="member">
    <div class="member-card">
      <div class="card front">
        <img
          :src="imageUrl"
          :alt="`${member.name}'s profile image`"
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
import axios from "axios";
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

// Generate the URL with a cache-busting timestamp
function generateImageUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${apiUrl}/api/team-member-image/${props.member.id}?t=${imageTimestamp.value}`;
}

// Fetch the team member image
async function fetchMemberImage() {
  try {
    // Set the URL with cache-busting parameter
    imageUrl.value = generateImageUrl();
    
    // Fetch the image to ensure it's in browser cache
    const response = await axios.get(imageUrl.value, {
      responseType: 'blob'
    });
    
    // If we want to use object URLs instead of direct linking (optional)
    // imageUrl.value = URL.createObjectURL(response.data);
  } catch (error) {
    console.error("Error fetching team member image:", error);
    // Fallback to a default image if fetch fails
    imageUrl.value = '../../../assets/default-profile.png';
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
</style>