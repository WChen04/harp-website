<template>
  <div>
    <TopStories ref="topStoriesComponent"/>
    <Explore :refresh-top-stories="refreshTopStories"/>
    <StayInTheLoop />
    <Footer />
  </div>
</template>

<script>
import Explore from "../components/Articles/ArticlesComponents/Explore.vue";
import StayInTheLoop from "../components/General/StayInTheLoop.vue";
import TopStories from "@/components/Articles/ArticlesComponents/TopStories.vue";
import Footer from "@/components/General/Footer.vue";

export default {
  components: { Explore, StayInTheLoop, TopStories, Footer },
  methods: {
    refreshTopStories() {
      // Access the TopStories component via ref and call its method
      this.$refs.topStoriesComponent.fetchArticles();
    }
  }
};
</script>

<style scoped></style>
