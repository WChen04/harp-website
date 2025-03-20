<template>
  <div class="page-container">
    <div class="login-container">
      <h1 class="login-title">Login</h1>
      
      <!-- Social Login Buttons -->
      <div class="social-buttons">
        <button 
          class="social-btn google" 
          aria-label="Sign in with Google"
          @click="handleSocialLogin('google')"
        ></button>
      </div>

      <p class="or-text">or</p>

      <!-- Login Form -->
      <form class="login-form" @submit="handleLogin">
        <label for="email" class="sr-only">Email Address</label>
        <input 
          id="email" 
          type="email" 
          v-model="email" 
          placeholder="Email Address" 
          class="input-field"
        />
        
        <label for="password" class="sr-only">Password</label>
        <input 
          id="password" 
          type="password" 
          v-model="password" 
          placeholder="Password" 
          class="input-field"
        />
        
        <a href="#" class="forgot-password" @click.prevent="$router.push('/forgot-password')">
          Forgot password?
        </a>  
        <button type="submit" class="sign-in-btn">Sign In</button>
      </form>

      <!-- Sign Up Link -->
      <p class="signup-text">
        Don't have an account yet? <a href="#" class="signup-link" @click.prevent="$router.push('/register')">Sign Up</a>
      </p>

      <!-- Response Message -->
      <p v-if="responseMessage" class="response-message">{{ responseMessage }}</p>

      <!-- Join AAS Button -->
      <button class="join-btn" @click="redirectToAAS">
        <img
          src="../assets/HARPResearchLockUps/AAS/AAS Logo.svg"
          alt="AAS Logo"
          class="aas-logo"
        />
        Join AAS
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  
  data() {
    return {
      email: '',
      password: '',
      responseMessage: ''
    };
  },

  methods: {
    async handleLogin(event) {
    event.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        email: this.email,
        password: this.password
      });

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Emit a custom event that we'll listen for
      window.dispatchEvent(new Event('userLoggedIn'));
      
      this.responseMessage = response.data.message;
      console.log('User Info:', response.data.user);
      this.$router.push('/');
    } catch (error) {
      this.responseMessage = error.response?.data?.error || 'Login failed.';
      console.error('Login error:', error);
    }
  },

  handleSocialLogin(provider) {
      if (provider === 'google') {
        window.location.href = 'http://localhost:3000 /auth/google';
        return;
      }
    
      // For other providers (temporary)
      this.responseMessage = `${provider} login not implemented yet`;
  },

    redirectToAAS() {
      window.location.href = 'https://aas.org/membership/join';
    }
  }
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

.social-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.social-btn {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.apple {
  background: url("../assets/SocialMediaIcons/apple-logo-transparent.png") no-repeat center;
  background-size: 50%;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.apple:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.microsoft {
  background: url("../assets/SocialMediaIcons/Microsoft_Logo_512px.png") no-repeat center;
  background-size: 50%;
  background-color: #f3f3f3;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.microsoft:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.google {
  background: url("../assets/SocialMediaIcons/Google_Icons-09-512.webp") no-repeat center;
  background-size: 50%;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.google:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.or-text {
  margin: 1rem 0;
  font-size: 1rem;
  color: #ccc;
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

.forgot-password {
  align-self: flex-end;
  font-size: 0.9rem;
  color: #ccc;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
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
}

.sign-in-btn:hover {
  opacity: 0.9;
}

.signup-text {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.signup-link {
  color: #00c6fb;
  text-decoration: none;
}

.signup-link:hover {
  text-decoration: underline;
}

.response-message {
  color: red;
  font-weight: bold;
  margin-top: 1rem;
}

.join-btn {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(90deg, #8a2387, #e94057, #f27121);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.aas-logo {
  width: 20px;
  height: 20px;
}
@media (min-width: 320px) {
  .login-container {
    width: 90%;
    padding: 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .social-buttons {
    justify-content: center;
  }

  .social-btn {
    width: 45px;
    height: 45px;
  }

  .input-field {
    padding: 0.6rem;
  }
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .login-container {
    width: 70%;
    padding: 2rem;
  }

  .login-title {
    font-size: 1.8rem;
  }

  .social-btn {
    width: 55px;
    height: 55px;
  }

  .input-field {
    padding: 0.8rem;
  }
}

/* Small Desktop (1024px and up) */
@media (min-width: 1024px) {
  .login-container {
    width: 50%;
  }

  .social-buttons {
    justify-content: flex-start;
  }
}

/* Medium Desktop (1220px and up) */
@media (min-width: 1220px) {
  .login-container {
    width: 40%;
    max-width: 600px;
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

  .social-btn {
    width: 60px;
    height: 60px;
  }
}
</style>