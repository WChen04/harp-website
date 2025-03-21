<template>
    <div class="page-container">
      <div class="login-container">
        <h1 class="login-title">Create Account</h1>
        
        <!-- Social Register Buttons -->
        <div class="social-buttons">
          <button 
            class="social-btn google" 
            aria-label="Sign up with Google"
            @click="initiateOAuth('google')"
          ></button>
        </div>
  
        <p class="or-text">or</p>
  
        <!-- Registration Form -->
        <form class="login-form" @submit="handleRegister">
          <label for="fullName" class="sr-only">Full Name</label>
          <input 
            id="fullName" 
            type="text" 
            v-model="fullName" 
            placeholder="Full Name" 
            class="input-field"
            required
          />
  
          <label for="email" class="sr-only">Email Address</label>
          <input 
            id="email" 
            type="email" 
            v-model="email" 
            placeholder="Email Address" 
            class="input-field"
            required
          />
          
          <label for="password" class="sr-only">Password</label>
          <input 
            id="password" 
            type="password" 
            v-model="password" 
            placeholder="Password" 
            class="input-field"
            required
          />
  
          <label for="confirmPassword" class="sr-only">Confirm Password</label>
          <input 
            id="confirmPassword" 
            type="password" 
            v-model="confirmPassword" 
            placeholder="Confirm Password" 
            class="input-field"
            required
          />
          
          <button type="submit" class="sign-in-btn">Create Account</button>
        </form>
  
        <!-- Login Link -->
        <p class="signup-text">
          Already have an account? <a href="#" class="signup-link" @click.prevent="$router.push('/login')">Sign In</a>
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
    name: 'RegisterPage',
    
    data() {
      return {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        responseMessage: ''
      };
    },
  
    methods: {
      async handleRegister(event) {
        event.preventDefault();
  
        if (this.password !== this.confirmPassword) {
          this.responseMessage = 'Passwords do not match.';
          return;
        }
        
        console.log("before response");
        try {
          const response = await axios.post('http://localhost:3000/api/register', {
            fullName: this.fullName,
            email: this.email,
            password: this.password
          });
          console.log("after response");
  
          this.responseMessage = response.data.message;
          alert('Registration successful! Please log in.');
          this.$router.push('/login');
        } catch (error) {
          this.responseMessage = error.response?.data?.error || 'Registration failed.';
          console.error('Registration error:', error);
        }
      },
  
      async handleSocialRegister(provider) {
        try {
          const response = await axios.post(`http://localhost:3000/api/social-register/${provider}`);
          if (response.data) {
            this.$router.push('/');
          }
        } catch (error) {
          this.responseMessage = error.response?.data?.error || `${provider} registration failed`;
        }
      },
  
      redirectToAAS() {
        window.location.href = 'https://aas.org/membership/join';
      },

      initiateOAuth(provider) {
      // Redirect to backend OAuth endpoint
      window.location.href = `http://localhost:3000/auth/${provider}`;
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
    padding-top: 7rem;
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
  }

  .social-buttons {
    justify-content: center;
  }

  .social-btn, .apple, .microsoft, .google {
    width: 45px;
    height: 45px;
  }

  .input-field {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .join-btn {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .page-container {
    padding-top: 5rem;
  }

  .login-container {
    width: 70%;
    padding: 2rem;
  }

  .login-title {
    font-size: 1.8rem;
  }

  .social-btn, .apple, .microsoft, .google {
    width: 55px;
    height: 55px;
  }

  .input-field {
    padding: 0.8rem;
    font-size: 1rem;
  }

  .join-btn {
    padding: 0.8rem;
    font-size: 1rem;
  }
}

/* Small Desktop (1024px and up) */
@media (min-width: 1024px) {
  .page-container {
    padding-top: 7rem;
  }

  .login-container {
    width: 50%;
  }

  .social-buttons {
    justify-content: flex-start;
  }

  .login-form {
    gap: 1.2rem;
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

  .social-btn, .apple, .microsoft, .google {
    width: 60px;
    height: 60px;
  }

  .input-field {
    padding: 1rem;
  }
}
  </style>