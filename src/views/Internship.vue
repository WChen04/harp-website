<script setup>
import Header from "@/components/General/Header.vue";

</script>

<template>
  <div class="internships">
    <Header
        title="Internship Opportunities"
        subtitle="Looking to start your career with us?"
    />
    <h1> Internship </h1>
    <p>Explore various internship opportunities available in our organization.</p>

    <div class="internship-list">
      <div class="internship-item" v-for="(internship, index) in internships" :key="index">
        <h2>{{ internship.title }}</h2>
        <p>{{ internship.description }}</p>
        <button @click="applyForInternship(internship.id)">Apply Now</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>