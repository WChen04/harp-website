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
            src="@/assets/HARPResearchLockUps/Photos/o2.jpg"
            alt="team photo"
          />
          <img
            src="@/assets/HARPResearchLockUps/Photos/o3.jpg"
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
          src="@/assets/HARPResearchLockUps/Photos/o1.jpg"
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
import TeamMember from "@/components/About/Frontend/TeamMemberCard.vue";
import { useAuthStore } from '../stores/auth.js';
import Header from "@/components/General/Header.vue";
import Footer from "@/components/General/Footer.vue";
import axios from "axios";

// Access the auth store
const authStore = useAuthStore();

// Reactive state
const selectedFilter = ref("all");
const teamMembers = ref([]);
const showAddModal = ref(false);
const submitting = ref(false);
const imagePreview = ref(null);

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
  } catch (error) {
    console.error("Error fetching team members:", error);
  }
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

async function submitTeamMember() {
  submitting.value = true;
  try {
    const formData = new FormData();
    
    // Append all member data to FormData
    for (const key in newMember.value) {
      formData.append(key, newMember.value[key]);
    }
    
    // Submit to API using environment variable for API URL
    await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/team-members`, 
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
    alert('Failed to add team member. Please try again.');
  } finally {
    submitting.value = false;
  }
}

// Hook that runs when the component is mounted
onMounted(() => {
  fetchTeamMembers();
});
</script>

<style scoped>
@import "../components/About/about.css";
</style>
