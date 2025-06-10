<template>
  <div class="stay-in-the-loop">
    <div class="image-section">
      <img
        src="../../assets/HARPResearchLockUps/Photos/team.webp"
        alt="team image"
        class="image-placeholder"
      />
    </div>
    <div class="content-section" ref="contentSection">
      <h1 id="FirstText" :class="firstTextVisible ? 'slide-in-right' : ''">
        Stay in the Loop.
      </h1>
      <span
        id="SecondaryText"
        :class="secondaryTextVisible ? 'slide-in-left' : ''"
      >
        Join our community of 1000+
      </span>
      <div class="subscribe-form">
        <input type="email" placeholder="Enter your email..." />
        <button type="submit" @click="handleSubscribe">Subscribe</button>
      </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" :class="{ show: subscribed }">
      <span class="icon">✅</span>
      <span class="message">You've successfully subscribed!</span>
    </div>

  </div>
</template>


<script>
export default {
  name: "StayInTheLoop",
  data() {
    return {
      firstTextVisible: false,
      secondaryTextVisible: false,
      subscribed: false, // ✅ Define it here to avoid Vue warning
    };
  },
  mounted() {
    this.initObserver();
  },
  methods: {
    initObserver() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.firstTextVisible = true;
              this.secondaryTextVisible = true;
            }
          });
        },
        {
          threshold: 0.5,
        }
      );

      observer.observe(this.$refs.contentSection);
    },
    handleSubscribe() {
      this.subscribed = true;
      setTimeout(() => {
        this.subscribed = false;
      }, 3000); // Hide toast after 3 seconds
    },
  },
};
</script>

<style scoped>
@import "./stayintheloop.css";
</style>
