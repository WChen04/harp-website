<script setup>
// import { initHeader, addListeners, initAnimation } from "./animation.js";
import GetStarted from "../General/GetStarted.vue";
import { gsap } from "gsap";
import { ref, onMounted, onUnmounted } from "vue";

const width = ref(window.innerWidth),
  height = ref(window.innerHeight),
  canvas = ref(null),
  ctx = ref(null),
  points = ref([]),
  target = ref(null),
  resizeTimeout = ref(null),
  animationFrame = ref(null);

onMounted(() => {
  addListeners();
  resize(true);
});

onUnmounted(() => {
  // removeListeners();
});

function initAnimation() {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");
  }
  cancelAnimationFrame(animationFrame.value);
  animate();
  gsap.globalTimeline.clear();
  // console.log(points.value.length);
  for (var i in points.value) {
    shiftPoint(points.value[i]);
  }
}

function initHeader() {
  // create points
  points.value = [];
  for (let x = 0; x < width.value; x = x + width.value / 10) {
    for (let y = 0; y < height.value; y = y + height.value / 20) {
      let px = x + (Math.random() * width.value) / 10;
      let py = y + (Math.random() * height.value) / 10;
      let p = { x: px, originX: px, y: py, originY: py };
      points.value.push(p);
    }
  }

  // for each point find the closest points
  for (var i = 0; i < points.value.length; i++) {
    var closest = [];
    var p1 = points.value[i];
    for (var j = 0; j < points.value.length; j++) {
      var p2 = points.value[j];
      if (!(p1 == p2)) {
        var placed = false;
        for (var k = 0; k < 3; k++) {
          if (!placed) {
            if (closest[k] == undefined) {
              closest[k] = p2;
              placed = true;
            }
          }
        }

        for (var k = 0; k < 3; k++) {
          if (!placed) {
            if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
              closest[k] = p2;
              placed = true;
            }
          }
        }
      }
    }
    p1.closest = closest;
  }

  // assign a circle to each point
  for (var i in points.value) {
    var c = new Circle(
      points.value[i],
      2 + Math.random() * 5,
      "rgba(16, 71, 190, 0.2)"
    );
    points.value[i]["circle"] = c;
  }
}

function animate() {
  // Clear the canvas before each frame
  if (canvas.value) {
    ctx.value.clearRect(0, 0, width.value, height.value);
    // const grad = ref(ctx.value.createLinearGradient(0,0, width.value,height.value));
    // grad.value.addColorStop(0, "lightblue");
    // grad.value.addColorStop(1, "darkblue");
    // resize();
  }

  for (let i in points.value) {
    // detect points in range
    let distanceToTarget = getDistance(target.value, points.value[i]);

    // Hide points and circles that are too close to the mouse (i.e. within a radius of 4000)
    if (distanceToTarget < 4000) {
      points.value[i].active = 0; // Set the point to inactive
      points.value[i].circle.active = 0; // Make the circle invisible
    } else if (distanceToTarget < 20000) {
      points.value[i].active = 0.1;
      points.value[i].circle.active = 0.3;
    } else if (distanceToTarget < 40000) {
      points.value[i].active = 0.2;
      points.value[i].circle.active = 0.4;
    } else {
      points.value[i].active = 0.3; // Make points further from the mouse more visible
      points.value[i].circle.active = 0.6;
    }

    // Only draw lines and circles for active points
    if (points.value[i].active > 0) {
      drawLines(points.value[i]); // Draw lines connecting points
      points.value[i].circle.draw(); // Draw the circle itself
    }
  }

  // Continuously request the next animation frame
  animationFrame.value = requestAnimationFrame(animate);
}

function addListeners() {
  if (!("ontouchstart" in window)) {
    window.addEventListener("mousemove", mouseMove);
  }
  // window.addEventListener("scroll", scrollCheck);
  window.addEventListener("resize", resizeWait);
}

// function removeListeners(){
//   if (!("ontouchstart" in window)) {
//     canvas.value.removeEventListener("mousemove", mouseMove);
//   }
//   // window.removeEventListener("scroll", scrollCheck);
//   window.removeEventListener("resize", resizeWait);
// }

function resizeWait() {
  resize(false);
}

function mouseMove(e) {
  // var posx = 0,
  //   posy = 0; // Initialize both posx and posy
  // if (e.pageX || e.pageY) {
  //   posx = e.pageX;
  //   posy = e.pageY;
  // }
  target.value.x = e.pageX;
  target.value.y = e.pageY;
  // console.log(e.pageX);
  // console.log(e.pageY);
}

// function scrollCheck() {
//   if (document.body.scrollTop > height) animateHeader.value = false;
//   else animateHeader.value = true;
// }

const resizeFunc = () => {
  width.value = window.innerWidth;
  height.value = window.innerHeight;

  if (canvas.value) {
    canvas.value.width = width.value;
    canvas.value.height = height.value;
    target.value = { x: width / 2, y: height / 2 };
  }
  initHeader();
  initAnimation();
};

function resize(init) {
  if (init) {
    resizeFunc();
  } else {
    if (resizeTimeout.value != null) {
      clearTimeout(resizeTimeout.value);
    }
    resizeTimeout.value = setTimeout(resizeFunc, 100);
  }
}

function shiftPoint(p) {
  gsap.to(p, {
    duration: 1 + 3 * Math.random(),
    x: p.originX - 50 + Math.random() * 100,
    y: p.originY - 50 + Math.random() * 100,
    ease: "circ.inOut", // Updated ease syntax
    onComplete: function () {
      shiftPoint(p);
    },
  });
}

function drawLines(p) {
  if (!p.active) return;
  for (var i in p.closest) {
    ctx.value.beginPath();
    ctx.value.moveTo(p.x, p.y);
    ctx.value.lineTo(p.closest[i].x, p.closest[i].y);
    ctx.value.strokeStyle = "rgba(16, 71, 190," + p.active + ")";
    ctx.value.stroke();
  }
}

function Circle(pos, rad, color) {
  var _this = this;
  _this.pos = pos || null;
  _this.radius = rad || null;
  _this.color = color || null;

  this.draw = function () {
    if (!_this.active) return;
    ctx.value.beginPath();
    ctx.value.arc(
      _this.pos.x,
      _this.pos.y,
      _this.radius,
      0,
      4 * Math.PI,
      false
    );
    ctx.value.fillStyle = "rgba(16, 71, 190," + _this.active + ")";
    ctx.value.fill();
  };
}

// Utility function to calculate the distance between points
function getDistance(p1, p2) {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}
</script>

<template>
  <div class="canvas-container">
    <canvas id="demo-canvas" ref="canvas"></canvas>
    <div id="opening-line-parent">
      <div id="opening-line">
        <h1>
          Effortless Task<br />
          Management with <br />
          <span class="gradient-text">Polymorphic AI</span>
        </h1>
        <h3 id="second-line">
          Pioneering Hybrid Symbolic-Synthetic AI for Next-Gen Task Planning
        </h3>
        <div class="action-items">
          <get-started></get-started>
        </div>
      </div>
    </div>
  </div>
  <div id="mouse-pos" ref="mouse-pos"></div>
</template>

<style>
@import "./animation.css";
</style>
