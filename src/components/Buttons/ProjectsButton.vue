<template>
  <router-link to="/projects" class="blue-button">
    Projects
    <ClipBoardIcon />
  </router-link>
</template>

<script>
import ClipBoardIcon from "../About/Frontend/ClipBoardIcon.vue";

export default {
  components: {
    ClipBoardIcon,
  },
};
</script>

<style scoped>
@media (min-width: 320px) {
  .blue-button {
    font-size: 1em;
    padding: 0.5em 0.75em;
    /* width: 45%; */
  }
  .blue-button svg {
    margin-left: 0.25em;
  }
}
@media (min-width: 768px) {
  .blue-button {
    font-size: 1em;
    padding: 0.5em 0.75em;
    /* width: 30%; */
  }
  .blue-button svg {
    margin-left: 0.25em;
  }
}

.blue-button {
  background-color: #124188;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  border-radius: 2em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  text-decoration: none;
  width: 8em;
}

.blue-button:hover {
  background-color: #0056b3;
}
</style>
