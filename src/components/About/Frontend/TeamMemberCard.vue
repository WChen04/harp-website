<template>
  <div class="member">
    <div class="member-card">
      <div class="card front">
        <img
          :src="memberImageUrl"
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
import { computed, ref, onMounted } from "vue";
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
const memberImageUrl = ref('');

const userIsAdmin = computed(() => {
  return authStore.isAdmin;
});

function editMember() {
  emit('edit', props.member);
}

function confirmDelete() {
  emit('delete', props.member.id);
}

// Fetch the team member image
async function fetchMemberImage() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const initialUrl = `${apiUrl}/api/team-member-image/${props.member.id}`;
    
    // Set initial URL before fetch completes
    memberImageUrl.value = initialUrl;
    
    const response = await axios.get(initialUrl, {
      responseType: 'blob' // Ensure binary data is received
    });
    
    // Convert Blob into a URL and update the ref
    memberImageUrl.value = URL.createObjectURL(response.data);
  } catch (error) {
    console.error("Error fetching team member image:", error);
    // Fallback to a default image if fetch fails
    memberImageUrl.value = '../../../assets/default-profile.png';
  }
}

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