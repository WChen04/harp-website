<script>
import Animation from "../components/Home/Animation.vue";
import AboutUsButton from "../components/Buttons/AboutUsButton.vue";
import ProjectsButton from "../components/Buttons/ProjectsButton.vue";
import Cube from "../components/Home/Cube.vue";
import ProductsButton from "@/components/Buttons/ProductsButton.vue";
import StayInTheLoop from "@/components/General/StayInTheLoop.vue";
import Footer from "../components/General/Footer.vue";

export default {
  components: {
    Animation,
    AboutUsButton,
    ProjectsButton,
    Cube,
    ProductsButton,
    StayInTheLoop,
    Footer,
  },
};
</script>

<template>
  <div>
    <Animation />
    <div class="harpstart">
      <div class="harp">
        <h1 id="intro">HARP Research Inc.</h1>
        <div class="founderphotos">
          <a href="https://www.linkedin.com/in/harper-chisari-117169164/" target="_blank" rel="noopener noreferrer">
            <img
              src="../assets/HARPResearchLockUps/Founder/Harper.webp"
              alt="Founder 1"
            />
          </a>
          <a href="https://www.linkedin.com/in/kevinscott2000/" target="_blank" rel="noopener noreferrer">
            <img
              src="../assets/HARPResearchLockUps/Founder/Kevin.webp"
              alt="Founder 2"
            />
          </a>
          <a href="https://www.linkedin.com/in/yuvalshimoni/" target="_blank" rel="noopener noreferrer">
            <img
              src="../assets/HARPResearchLockUps/Founder/Yuval.webp"
              alt="Founder 3"
            />
          </a>
        </div>
        <div class="founderinfo">
          <h1>FOUNDERS OF HARP</h1>
          <h1>RESEARCH INC.</h1>
        </div>
      </div>

      <div class="harpright">
        <div class="harpinfo">
          <h1>
            At HARP Research, we're leading the way in making AI smarter and
            more accessible with our Polymorphic AI Framework—tailored solutions
            now, and the future of Artificial General Intelligence tomorrow.
          </h1>
          <AboutUsButton />
        </div>
      </div>
    </div>

    <div class="harpprojects">
      <h1 id="intro2">Products</h1>
      <div class="harp2">
        <div class="vertical-line"></div>

        <div class="harpinfo2">
          <h1 id="projectstext">
            Transforming AI's powerful predictions into ultra-compact tools,
            small enough to fit on <br />
            <span class="gradient-text">a calculator.</span>
          </h1>
          <ProductsButton />
        </div>

        <div>
          <img
            src="../assets/HARPResearchLockUps/Photos/Chip.webp"
            alt=""
            id="chipimg"
          />
        </div>
      </div>
    </div>

    <div class="harpproducts">
      <div class="vertical-line"></div>
      <div class="productsinfo">
        <h1 class="harpproductsinfo">
          With years of AI expertise, we’ve created Polymorphic AI—an efficient,
          open-source framework anyone can use,<br />
          <span class="product-text">no super computer needed.</span>
        </h1>
        <!-- <ProductsButton></ProductsButton> -->
      </div>
      <Cube></Cube>
    </div>

    <div class="images">
      <img src="../assets/HARPResearchLockUps/Photos/Example1.webp" alt="img" />
      <img src="../assets/HARPResearchLockUps/Photos/Example2.webp" alt="img" />
    </div>

    <StayInTheLoop></StayInTheLoop>
    <Footer></Footer>
  </div>
</template>

<style lang="css" scoped>
@import "../components/Home/home.css";
</style>
