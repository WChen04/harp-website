<!-- <template>
  <router-link to="/products" class="blue-button">
    Products
    <ClipBoardIcon />
  </router-link>
</template>

<script>
import ClipBoardIcon from "../About/ClipBoardIcon.vue";

export default {
  components: {
    ClipBoardIcon,
  },
};
</script>

<style scoped>
@media (min-width: 320px) {
  .blue-button {
    font-size: 0.5em;
    padding: 0.5em 0.75em;
    width: 45%;
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
}

.blue-button:hover {
  background-color: #0056b3;
}
</style> -->
<template>
  <router-link to="/products" class="blue-button">
    Products
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
.blue-button {
  background-color: #124188;
  color: white;
  border: none;
  display: inline-flex; /* Ensures the button wraps only around the content */
  align-items: center;
  border-radius: 2em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  text-decoration: none;
  padding: 0.5em 0.75em;
  width: auto; /* Removes fixed width constraints */
  white-space: nowrap; /* Prevents text wrapping */
}

.blue-button svg {
  margin-left: 0.25em;
}

.blue-button:hover {
  background-color: #0056b3;
}
</style>
