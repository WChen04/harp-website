<template>
  <div class="About">
      <Header
        title="About"
        subtitle="We deliver next-gen AI solutions that drive innovation and unlock new possibilities"
      />
    <div class="info-container">
      <div class="values">
        <div class="values-img">
          <img
            src="../assets/HARPResearchLockUps/Photos/o2.jpg"
            alt="team photo"
          />
          <img
            src="../assets/HARPResearchLockUps/Photos/o3.jpg"
            alt="team photo2"
          />
        </div>
        <div class="values-text">
          <h5>Our Values</h5>
          <h2>Meet HARP Research Inc.</h2>
          <div class="gradient-text">
            <h2 class="gradient one">Pioneers.</h2>
            <h2 class="gradient two">Innovative.</h2>
            <h2 class="gradient three">Polymorphic.</h2>
          </div>
          <h6 id="valuetext">
            Join a dynamic and collaborative team where diverse talents from a
            wide range of fields converge to shape the future. From leading
            researchers and core innovators to visionaries in technology and
            beyond, we bring together expertise and passion to push the
            boundaries of what's possible, driving innovation and creating
            meaningful impact on a global scale.
          </h6>
        </div>
      </div>
      <div class="mission">
        <div class="mission-text">
          <h5>Our Story and Mission</h5>
          <h2>
            Automation tools created for <br />
            <span class="everyone">everyone</span>
          </h2>
          <h6 id="missiontext">
            After years of developing our virtual lithography technology, we
            refocused our efforts on AI. After testing our framework developing
            software tools for the FDA's Summer Food Service Program, we began
            developing the Simplified Semantic System Synthesis Framework, or
            S4, our proprietary polymorphic AI language, built from the ground
            up for planning. From here, HARP research hopes to expand its
            capabilities, allowing anyone to create anything.
          </h6>
        </div>
        <img
          class="mission-img"
          src="../assets/HARPResearchLockUps/Photos/o1.jpg"
          alt="team photo"
        />
      </div>
    </div>
    <div class="team">
      <h2 class="team-foundersHeader">Founders & Management</h2>
      <button v-if="userIsAdmin" @click="showAddModal = true" class="add-team-btn">
        Add Management
      </button>
      <div class="team-foundersCards">
        <TeamMember
          v-for="member in teamMembers.filter((member) => member.founder)"
          :key="member.id"
          :member="member"
          @edit="editMember"
          @delete="deleteMember"
        />
      </div>
      <h2 class="team-membersHeader">Team Members</h2>
      <div class="team-dropdown">
        <select @change="handleDropdownChange($event)">
          <option value="all">View All</option>
          <option value="Developer">Developers</option>
          <option value="Researcher">Researchers</option>
          <option value="Fall 2024">Fall 2024</option>
          <option value="Spring 2025">Spring 2025</option>
        </select>
      </div>
      <button v-if="userIsAdmin" @click="showAddModal = true" class="add-team-btn">
        Add Team Member
      </button>
      <div class="team-membersCards">
        <TeamMember
          v-for="member in filteredTeamMembers"
          :key="member.id"
          :member="member"
          @edit="editMember"
          @delete="deleteMember"
        />
      </div>
    </div>

    <!-- <div class="join">
      <div class="join-text">
        <h2>Join our team</h2>
        <p>
          After years of developing our virtual lithography technology, we
          refocused our efforts on AI. After testing our framework developing
          software  tools for the FDA's Summer Food Service Program, we began
          developing the Simplified Semantic System Syn
        </p>
        <div class="button-wrapper">
          <CareersButton label="Careers" />
        </div>
      </div>
    </div> -->
    <Footer />
  </div>
  
  <!-- Team Member Add Modal -->
  <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Add New Team Member</h2>
        <form @submit.prevent="submitTeamMember" class="team-form">
          <!-- Name -->
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              v-model="newMember.name" 
              required
            />
          </div>
          
          <!-- Role -->
          <div class="form-group">
            <label for="role">Role/Position</label>
            <input 
              type="text" 
              id="role" 
              v-model="newMember.role" 
              required
            />
          </div>
          
          <!-- GitHub Link -->
          <div class="form-group">
            <label for="github">GitHub Link</label>
            <input 
              type="url" 
              id="github" 
              v-model="newMember.github_link" 
              placeholder="https://github.com/username"
            />
          </div>
          
          <!-- LinkedIn Link -->
          <div class="form-group">
            <label for="linkedin">LinkedIn Link</label>
            <input 
              type="url" 
              id="linkedin" 
              v-model="newMember.linkedin_link" 
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          
          <!-- Semester -->
          <div class="form-group">
            <label for="semester">Semester</label>
            <select 
              id="semester" 
              v-model="newMember.semester" 
              required
            >
              <option value="">Select a semester</option>
              <option value="Fall 2024">Fall 2024</option>
              <option value="Spring 2025">Spring 2025</option>
            </select>
          </div>
          
          <!-- Member Type -->
          <div class="form-group">
            <label for="memberType">Member Type</label>
            <select 
              id="memberType" 
              v-model="newMember.member_type" 
              required
            >
              <option value="">Select a type</option>
              <option value="Developer">Developer</option>
              <option value="Admin">Admin</option>
              <option value="Researcher">Researcher</option>
            </select>
          </div>
          
          <!-- Founder Status -->
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="founder" 
              v-model="newMember.founder"
            />
            <label for="founder">Founder/Management</label>
          </div>
          
          <!-- Profile Image Upload -->
          <div class="form-group">
            <label for="image">Profile Image</label>
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
          
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Add Team Member' }}
            </button>
          </div>
        </form>
      </div>
  </div>
  <!-- Team Member Edit Modal -->
  <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Edit Team Member</h2>
        <form @submit.prevent="updateTeamMember" class="team-form">
          <!-- Name -->
          <div class="form-group">
            <label for="edit-name">Full Name</label>
            <input 
              type="text" 
              id="edit-name" 
              v-model="editingMember.name" 
              required
            />
          </div>
          
          <!-- Role -->
          <div class="form-group">
            <label for="edit-role">Role/Position</label>
            <input 
              type="text" 
              id="edit-role" 
              v-model="editingMember.role" 
              required
            />
          </div>
          
          <!-- GitHub Link -->
          <div class="form-group">
            <label for="edit-github">GitHub Link</label>
            <input 
              type="url" 
              id="edit-github" 
              v-model="editingMember.github_url" 
              placeholder="https://github.com/username"
            />
          </div>
          
          <!-- LinkedIn Link -->
          <div class="form-group">
            <label for="edit-linkedin">LinkedIn Link</label>
            <input 
              type="url" 
              id="edit-linkedin" 
              v-model="editingMember.linkedin_url" 
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          
          <!-- Semester -->
          <div class="form-group">
            <label for="edit-semester">Semester</label>
            <select 
              id="edit-semester" 
              v-model="editingMember.semester" 
              required
            >
              <option value="">Select a semester</option>
              <option value="Fall 2024">Fall 2024</option>
              <option value="Spring 2025">Spring 2025</option>
            </select>
          </div>
          
          <!-- Member Type -->
          <div class="form-group">
            <label for="edit-memberType">Member Type</label>
            <select 
              id="edit-memberType" 
              v-model="editingMember.member_type" 
              required
            >
              <option value="">Select a type</option>
              <option value="Developer">Developer</option>
              <option value="Admin">Admin</option>
              <option value="Researcher">Researcher</option>
            </select>
          </div>
          
          <!-- Founder Status -->
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="edit-founder" 
              v-model="editingMember.founder"
            />
            <label for="edit-founder">Founder/Management</label>
          </div>
          
          <!-- Profile Image Upload -->
          <div class="form-group">
            <label for="edit-image">Profile Image</label>
            <input 
              type="file" 
              id="edit-image" 
              @change="handleEditImageUpload" 
              accept="image/*"
            />
            <div v-if="editImagePreview" class="image-preview">
              <img :src="editImagePreview" alt="Preview" />
            </div>
            <p class="image-note" v-if="!editImageChanged">Leave empty to keep current image</p>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="updating">
              {{ updating ? 'Updating...' : 'Update Team Member' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  <!-- Confirmation Modal -->
  <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal-content confirm-modal">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this team member? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="showConfirmModal = false" class="cancel-btn">Cancel</button>
          <button @click="confirmDeleteMember" class="delete-btn" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import TeamMember from "../components/About/Frontend/TeamMemberCard.vue";
import { useAuthStore } from '../stores/auth.js';
import Header from "../components/General/Header.vue";
import Footer from "../components/General/Footer.vue";
import { imagePreloader } from "../components/About/Frontend/imagePreloader.js";
import axios from "axios";

// Access the auth store
const authStore = useAuthStore();

// Reactive state
const selectedFilter = ref("all");
const teamMembers = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false); // New state for edit modal
const showConfirmModal = ref(false);
const submitting = ref(false);
const updating = ref(false); // New state for tracking edit submission
const imagePreview = ref(null);
const editImagePreview = ref(null); // New state for edit image preview
const editImageChanged = ref(false); // Track if the image was changed
const deleting = ref(false);
const memberToDelete = ref(null);


// New team member object
const newMember = ref({
  name: '',
  role: '',
  github_link: '',
  linkedin_link: '',
  semester: '',
  member_type: '',
  founder: false,
  image: null
});

// Editing team member object
const editingMember = ref({
  id: null,
  name: '',
  role: '',
  github_url: '',
  linkedin_url: '',
  semester: '',
  member_type: '',
  founder: false,
  image: null
});

// Computed property for filtered team members
const filteredTeamMembers = computed(() => {
  if (selectedFilter.value === "all") {
    return teamMembers.value.filter((member) => !member.founder);
  }
  if (selectedFilter.value === "Fall 2024" || selectedFilter.value === "Spring 2025") {
    return teamMembers.value.filter(
      (member) => !member.founder && member.semester === selectedFilter.value
    );
  }
  return teamMembers.value.filter(
    (member) => !member.founder && member.member_type === selectedFilter.value
  );
});

// Computed property for admin check
const userIsAdmin = computed(() => {
  return authStore.isAdmin;
});

// Methods
async function fetchTeamMembers() {
  try {
    // Update the URL to use environment variable for API URL
    let url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members`;
    
    if (
      selectedFilter.value === "Developer" ||
      selectedFilter.value === "Researcher" ||
      selectedFilter.value === "Fall 2024" ||
      selectedFilter.value === "Spring 2025"
    ) {
      url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members?semester=${selectedFilter.value}`;
    }
    
    const response = await axios.get(url);
    teamMembers.value = response.data;
    
    // Preload images for better performance
    preloadTeamMemberImages();
  } catch (error) {
    console.error("Error fetching team members:", error);
  }
}

// Preload team member images
async function preloadTeamMemberImages() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const imageUrls = teamMembers.value.map(member => 
    `${apiUrl}/api/team-member-image/${member.id}`
  );
  
  // Preload images in background (don't await to avoid blocking UI)
  imagePreloader.preloadImages(imageUrls, 2).catch(error => {
    console.warn("Some images failed to preload:", error);
  });
}

function handleDropdownChange(event) {
  selectedFilter.value = event.target.value;
  fetchTeamMembers();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    newMember.value.image = file;
    imagePreview.value = URL.createObjectURL(file);
  }
}

function handleEditImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    editingMember.value.image = file;
    editImagePreview.value = URL.createObjectURL(file);
    editImageChanged.value = true;
  }
}

// Add this function to handle delete confirmation
function openDeleteConfirmation(member) {
  memberToDelete.value = member;
  showConfirmModal.value = true;
}
function editMember(member) {
  // Fetch the latest member data first
  axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members/${member.id}`)
    .then(response => {
      // Copy member data to editing form
      editingMember.value = { ...response.data };
      
      // Fetch and display current image
      fetchMemberImageForEdit(member.id);
      
      // Reset edit image state
      editImageChanged.value = false;
      
      // Show edit modal
      showEditModal.value = true;
    })
    .catch(error => {
      console.error("Error fetching member details:", error);
      alert("Failed to load member details. Please try again.");
    });
}

async function fetchMemberImageForEdit(memberId) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const imageUrl = `${apiUrl}/api/team-member-image/${memberId}`;
    
    const response = await axios.get(imageUrl, {
      responseType: 'blob'
    });
    
    // Convert Blob into a URL and update the preview
    editImagePreview.value = URL.createObjectURL(response.data);
  } catch (error) {
    console.error("Error fetching team member image for edit:", error);
    editImagePreview.value = null;
  }
}

async function updateTeamMember() {
  updating.value = true;
  try {
    const formData = new FormData();
    
    // Append all member data to FormData
    formData.append('name', editingMember.value.name);
    formData.append('role', editingMember.value.role);
    formData.append('github_link', editingMember.value.github_url);
    formData.append('linkedin_link', editingMember.value.linkedin_url);
    formData.append('semester', editingMember.value.semester);
    formData.append('member_type', editingMember.value.member_type);
    formData.append('founder', editingMember.value.founder);
    
    // Only append image if it was changed
    if (editingMember.value.image && editImageChanged.value) {
      formData.append('image', editingMember.value.image);
    }
    
    // Log the FormData contents for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }
    
    // Submit to API using environment variable for API URL
    console.log("Updating team member data...");
    const response = await axios.put(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members/${editingMember.value.id}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true // Ensure cookies are sent for authentication
      }
    );
    
    console.log("API response:", response.data);
    
    // Reset form and close modal after successful submission
    editingMember.value = {
      id: null,
      name: '',
      role: '',
      github_url: '',
      linkedin_url: '',
      semester: '',
      member_type: '',
      founder: false,
      image: null
    };
    editImagePreview.value = null;
    editImageChanged.value = false;
    showEditModal.value = false;
    
    // Refresh team members list
    fetchTeamMembers();
    
    // Show success message
    alert('Team member updated successfully!');
    
  } catch (error) {
    console.error('Error updating team member:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    alert(`Failed to update team member: ${error.response ? error.response.data.error : error.message}`);
  } finally {
    updating.value = false;
  }
}

// Add this function to handle the actual deletion
async function confirmDeleteMember() {
  if (!memberToDelete.value) return;
  
  deleting.value = true;
  try {
    // Submit to API using environment variable for API URL
    await axios.delete(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members/${memberToDelete.value.id}`, 
      {
        withCredentials: true // Ensure cookies are sent for authentication
      }
    );
    
    // Refresh team members list
    fetchTeamMembers();
    
    // Reset state
    showConfirmModal.value = false;
    memberToDelete.value = null;
    
  } catch (error) {
    console.error('Error deleting team member:', error);
    alert('Failed to delete team member. Please try again.');
  } finally {
    deleting.value = false;
  }
}

async function submitTeamMember() {
  submitting.value = true;
  try {
    const formData = new FormData();
    
    // Append all member data to FormData
    for (const key in newMember.value) {
      if (key === 'image' && newMember.value[key]) {
        formData.append('image', newMember.value[key]);
      } else if (newMember.value[key] !== null && newMember.value[key] !== undefined) {
        formData.append(key, newMember.value[key]);
      }
    }
    
    // Submit to API using environment variable for API URL
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members-put`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true // Ensure cookies are sent for authentication
      }
    );
    
    // Reset form after successful submission
    newMember.value = {
      name: '',
      role: '',
      github_link: '',
      linkedin_link: '',
      semester: '',
      member_type: '',
      founder: false,
      image: null
    };
    imagePreview.value = null;
    showAddModal.value = false;
    
    // Refresh team members list
    fetchTeamMembers();
    
  } catch (error) {
    console.error('Error submitting team member:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    alert(`Failed to add team member: ${error.response ? error.response.data.error : error.message}`);
  } finally {
    submitting.value = false;
  }
}

async function deleteMember(memberId) {
  openDeleteConfirmation({ id: memberId });
}

// Hook that runs when the component is mounted
onMounted(() => {
  fetchTeamMembers();
});
</script>

<style scoped>
@import "../components/About/about.css";
</style>
