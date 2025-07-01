<script setup>
import Header from "@/components/General/Header.vue";
import Footer from "@/components/General/Footer.vue";
import SoftwareDev from "../components/Internships/SoftwareDev.vue";
import ResearchProgram from "../components/Internships/ResearchProgram.vue";
import BusinessProgram from "../components/Internships/BusinessProgram.vue";
import PAP from "../components/Internships/PAP.vue";
import ApplyNowButton from "../components/Buttons/ApplyNowButton.vue";
</script>

<template>
  <div class="internships">
    <Header
        title="Internship Opportunities"
        subtitle="Looking to start your career with us?"
    />
    <div class="internship-top-section">
      <div class="internship-intro">
        <div class="intro-text">
          <p class="label">About our Internships</p>
          <h1>Why work at HARP Research?</h1>
          <p class="description">
            Some intro to the internships.... Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur.
          </p>
        </div>
        <div class="apply-btn-wrapper">
          <ApplyNowButton/>
        </div>
      </div>
    </div>

    <div class="internship-bottom-section">
      <div class="positions-column">
        <h2>Available Positions</h2>
        <ul class="positions-list">
          <li>Software Development Internship Program</li>
          <li>Independent Research Fellowship Program</li>
          <li>Business Development Internship Program</li>
          <li>Professional Acceleration Program</li>
        </ul>
      </div>
      <div class="learn-more-column">
        <h2>Learn more about our internships</h2>
      </div>
    </div>
    <SoftwareDev />
    <ResearchProgram />
    <BusinessProgram />
    <PAP />
  </div>
  <Footer />
</template>

<style scoped>
@import "../components/Internships/Internships.css";
</style>