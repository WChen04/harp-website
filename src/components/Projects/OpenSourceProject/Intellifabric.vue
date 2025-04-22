<template>
  <div class="openSource">
    <div class="openSource-header">
      <h1>IntelliFabric CAD</h1>
      <h3>
       TEST
      </h3>
      <GradientButton label="Try Now" class="small-button" />
    </div>
    <div class="mission">
      <div class="mission-img">
        <img
          src="../../../assets/HARPResearchLockUps/Graphs/nodeGraph.png"
          alt="node graph"
        />
      </div>
      <div class="mission-text">
        <h5>Our Story and Mission</h5>
        <h2>
          Accessible automation tools creating value for
          <span class="everyone">everyone</span>
        </h2>
        <h6 id="valuetext">
          After years of developing our virtual lithography technology, we
          refocused our efforts on AI. After testing our framework developing
          software tools for the FDA's Summer Food Service Program, we began
          developing the Simplified Semantic System Synthesis Framework, or S4,
          our proprietary polymorphic AI language, built from the ground up for
          planning. From here, HARP research hopes to expand its capabilities,
          allowing anyone to create anything.
        </h6>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import GradientButton from "@/components/Buttons/GradientButton.vue";

import Footer from "@/components/General/Footer.vue";
</script>

<style lang="css" scoped>
.openSource {
    align-items: center;
    text-align: center;
    padding: 2rem;
    color: white;
    padding-bottom: 0;
    padding-left: 0;
    padding-right: 0;
  }
  
  .openSource-header {
    max-width: 100vw;
    margin-top: 10rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8rem;
  }
  
  .openSource-header h1,
  .openSource-header h3 {
    color: white;
    margin: 0.5rem 0;
    max-width: 50vw;
  }
  
  .openSource-header h1 {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 2rem;
  }
  
  .openSource-header h3 {
    font-size: 1rem;
    font-weight: normal;
    margin-bottom: 3rem;
  }
  
  .small-button {
    width: 10rem;
  }
  .mission {
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 4rem 8rem;
    flex-wrap: wrap;
    margin-bottom: 8rem;
  }
  .everyone {
    background: linear-gradient(
      270deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(88, 0, 251, 1) 90%
    );
    background-clip: text;
    color: transparent;
    margin: 0;
    font-size: 2rem;
    font-weight: bold;
  }
  
  .mission-text {
    flex: 1;
  
    text-align: left;
  }
  .mission-text h2 {
    margin-bottom: 2rem;
    font-weight: bold;
    font-size: 2rem;
  }
  .mission-text h6 {
    font-size: 0.9rem;
  }
  
  .mission-img {
    flex: 1;
    margin-right: 10rem;
  }
  img {
    border-radius: 10%;
  }

</style>
