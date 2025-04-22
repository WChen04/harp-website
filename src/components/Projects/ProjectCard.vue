<template>
    <router-link :to="project.link" class="project-link"> 
        <div class="project-card">
            <div class="card front">
                <img
              src="@/assets/HARPResearchLockUps/Photos/prometheus.webp" 
                alt="Project Image"
                class="project-image"
                />
                <div class="member-box"></div>
                <h4 class="project-name">{{ project.name }}</h4>
                <div class="tags">
                    <span>{{ project.type }}</span>
                </div>
            </div>
        </div>
    </router-link>
</template>

<script setup>
import { defineProps } from 'vue';
const props = defineProps({
    project: {
        type: Object,
        required: true,
    },
});
</script>

<style lang="css" scoped>
.project-link {
    text-decoration: none;
}

.project-card {
    width: 15rem;
    height: 15rem;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    border-radius: 10%;
    background: linear-gradient(to bottom, #54204d 0%, #7db9e8 100%);
    color: white;
    transition: transform 0.3s;
    overflow: hidden;
    padding: 0;
}

.project-card:hover {
    transform: scale(1.05);
}

.card.front {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.project-image {
    width: 100%;
    height: 70%;
    object-fit: cover;
    object-position: center;
    margin-bottom: 0;
}

.member-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1rem;
}

.project-name {
    position: absolute;
    top: 75%;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    font-size: 1.1rem;
    text-align: center;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0 10px;
}

.tags {
    display: none;
}


</style>