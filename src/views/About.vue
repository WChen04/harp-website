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
            boundaries of what’s possible, driving innovation and creating
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
            refocused our efforts on AI. After testing our framework developing
            software tools for the FDA's Summer Food Service Program, we began
            developing the Simplified Semantic System Synthesis Framework, or
            S4, our proprietary polymorphic AI language, built from the ground
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
      <div class="team-foundersCards">
        <TeamMember
          v-for="member in teamMembers.filter((member) => member.founder)"
          :key="member.id"
          :member="member"
        />
      </div>
      <h2 class="team-membersHeader">Team Members</h2>
      <!-- Dropdown for filtering team members -->
      <div class="team-dropdown">
        <select @change="handleDropdownChange($event)">
          <option value="all">View All</option>
          <option value="Developer">Developers</option>
          <option value="Researcher">Researchers</option>
          <option value="Fall 2024">Fall 2024</option>
          <option value="Spring 2025">Spring 2025</option>
        </select>
      </div>
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
          refocused our efforts on AI. After testing our framework developing
          software  tools for the FDA's Summer Food Service Program, we began
          developing the Simplified Semantic System Syn
        </p>
        <div class="button-wrapper">
          <CareersButton label="Careers" />
        </div>
      </div>
    </div> -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import TeamMember from "@/components/About/Frontend/TeamMemberCard.vue";
import Header from "@/components/General/Header.vue";
import Footer from "@/components/General/Footer.vue";
import axios from "axios";

const selectedFilter = ref("all");
const teamMembers = ref([]);

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

async function fetchTeamMembers() {
  try {
    let url = "http://localhost:3000/api/team-members";
    if (
      selectedFilter.value === "Developer" ||
      selectedFilter.value === "Researcher" ||
      selectedFilter.value === "Fall 2024" ||
      selectedFilter.value === "Spring 2025"
    ) {
      url = `http://localhost:3000/api/team-members?semester=${selectedFilter.value}`;
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

onMounted(() => {
  fetchTeamMembers();
});
</script>

<style scoped>
@import "../components/About/about.css";
</style>
