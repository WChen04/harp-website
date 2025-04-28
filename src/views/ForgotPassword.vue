<template>
  <div class="page-container">
    <div class="login-container">
      <h1 class="login-title">Reset Password</h1>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label for="email" class="sr-only">Email Address</label>
        <input
          id="email"
          type="email"
          v-model="email"
          placeholder="Email Address"
          class="input-field"
          required
        />

        <button type="submit" class="sign-in-btn">Send Reset Link</button>
      </form>

      <p v-if="message" :class="['response-message', messageType]">
        {{ message }}
      </p>

      <!-- Add this section to display reset link in development -->
      <div v-if="resetLink" class="mt-4 p-4 bg-gray-800 rounded">
        <p class="text-sm mb-2">
          Development Mode: Use this link to reset password
        </p>
        <a :href="resetLink" class="text-blue-400 break-all">{{ resetLink }}</a>
      </div>

      <p class="signup-text">
        Remember your password?
        <a href="#" @click.prevent="$router.push('/login')" class="signup-link"
          >Back to Login</a
        >
      </p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import emailjs from "@emailjs/browser";

export default {
  name: "ForgotPassword",

  data() {
    return {
      email: "",
      message: "",
      messageType: "error",
      resetLink: null,
    };
  },

  methods: {
    async handleSubmit(event) {
      event.preventDefault();
      const baseURL = import.meta.env.VITE_API_URL || '';

      try {
        // First make the API call to generate token
        const response = await axios.post(
          `${baseURL}/api/forgot-password`,
          {
            email: this.email,
          }
        );

        // Get the reset link (assuming your API returns it)
        const resetLink = response.data.resetLink;
        // CHANGE THIS PLEASE DO NOT USE MY EMAILJS
        await emailjs.send(
          "service_bodydb1", // Get this from EmailJS dashboard
          "template_qlak4bk", // Get this from EmailJS dashboard
          {
            to_email: this.email,
            link: resetLink,
            // Add any other template variables you want to use
          },
          "eQRYlJGEPeKpiZ05I" // Get this from EmailJS dashboard
        );

        this.message =
          "Password reset instructions have been sent to your email";
        this.messageType = "success";

        // Store reset link if in development mode
        if (process.env.NODE_ENV === "development") {
          this.resetLink = resetLink;
        }
      } catch (error) {
        this.message =
          error.response?.data?.error || "An error occurred. Please try again.";
        this.messageType = "error";
        this.resetLink = null;
      }
    },
  },
  mounted() {
    // Initialize EmailJS
    // emailjs.init('3RIW7oSvvKsCnIqVq');
  },
};
</script>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding-top: 5rem;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: left;
  color: #fff;
  padding: 2rem;
  width: 50%;
  background: #1c1c1c;
  border-radius: 10px;
}

.login-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.input-field {
  width: 100%;
  padding: 0.8rem;
  border-radius: 5px;
  border: 1px solid #444;
  background-color: #1e1e1e;
  color: #fff;
}

.input-field::placeholder {
  color: #888;
}

.sign-in-btn {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(90deg, #005bea, #00c6fb);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: opacity 0.3s;
}

.sign-in-btn:hover {
  opacity: 0.9;
}

.signup-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
}

.signup-link {
  color: #00c6fb;
  text-decoration: none;
}

.signup-link:hover {
  text-decoration: underline;
}

.response-message {
  margin-top: 1rem;
  font-weight: bold;
}

.response-message.error {
  color: #ff4444;
}

.response-message.success {
  color: #4caf50;
}
/* Mobile First (320px and up) */
@media (min-width: 320px) {
  .page-container {
    padding-top: 3rem;
  }

  .login-container {
    width: 90%;
    padding: 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .input-field {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .sign-in-btn {
    padding: 0.7rem;
    font-size: 0.9rem;
  }

  .signup-text {
    font-size: 0.8rem;
  }
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .page-container {
    padding-top: 4rem;
  }

  .login-container {
    width: 70%;
    padding: 2rem;
  }

  .login-title {
    font-size: 1.8rem;
  }

  .input-field {
    padding: 0.8rem;
    font-size: 1rem;
  }

  .sign-in-btn {
    padding: 0.8rem;
    font-size: 1rem;
  }

  .signup-text {
    font-size: 0.9rem;
  }
}

/* Small Desktop (1024px and up) */
@media (min-width: 1024px) {
  .page-container {
    padding-top: 5rem;
  }

  .login-container {
    width: 50%;
  }

  .login-form {
    gap: 1.2rem;
  }
}

/* Medium Desktop (1220px and up) */
@media (min-width: 1220px) {
  .login-container {
    width: 40%;
    max-width: 500px;
  }
}

/* Large Desktop (1440px and up) */
@media (min-width: 1440px) {
  .login-container {
    width: 35%;
    padding: 2.5rem;
  }

  .login-title {
    font-size: 2rem;
  }

  .input-field {
    padding: 1rem;
  }

  .response-message {
    font-size: 1.1rem;
  }
}
</style>
