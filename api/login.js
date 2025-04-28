import { corsHeaders, handleCors } from './_config';
import { query } from '../utils/db'
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  // Handle CORS preflight request
  if (handleCors(req, res)) return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Find user in database
    const { rows } = await query(
      'SELECT * FROM "Login" WHERE email = $1',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const user = rows[0];
    
    // In a real app, you'd compare hashed passwords here
    if (password !== user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        email: user.email,
        full_name: user.full_name,
        is_admin: user.is_admin || false
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: '24h' }
    );
    
    // Update last login
    await query(
      'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
      [email]
    );
    
    // Return user info and token
    return res.status(200).json({
      token,
      user: {
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        is_admin: user.is_admin || false
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}