import pg from "pg";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
dotenv.config();

// Database configuration
const { Pool } = pg;
const dbConnectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// JWT authentication middleware
const authenticateJWT = (req) => {
  return new Promise((resolve) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret", (err, user) => {
        if (err) {
          resolve(null);
        } else {
          resolve(user);
        }
      });
    } else {
      resolve(null);
    }
  });
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || "https://harp-website.vercel.app",
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

// Helper function to handle CORS preflight requests
const handleCors = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return true;
  }
  return false;
};

export { pool, authenticateJWT, corsHeaders, handleCors };