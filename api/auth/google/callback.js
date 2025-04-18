import { pool, corsHeaders, handleCors } from '../../_config';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  // Handle CORS preflight request
  if (handleCors(req, res)) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization code from query params
    const { code, state } = req.query;
    
    if (!code) {
      console.error('No code provided in Google callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://harp-website.vercel.app'}/login?error=no_code`);
    }
    
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'https://your-vercel-domain.vercel.app/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token exchange error:', errorData);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://harp-website.vercel.app'}/login?error=token_exchange`);
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;
    
    // Fetch user data from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      console.error('Failed to fetch user data from Google');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://harp-website.vercel.app'}/login?error=user_data`);
    }
    
    const userData = await userResponse.json();
    
    // Check if user exists in the database
    const { rows } = await pool.query(
      'SELECT * FROM "Login" WHERE email = $1 OR google_id = $2',
      [userData.email, userData.id]
    );
    
    let user;
    
    if (rows.length) {
      // Update existing user
      user = rows[0];
      await pool.query(
        'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP, google_id = $1, is_active = true WHERE email = $2',
        [userData.id, userData.email]
      );
    } else {
      // Create new user
      const newUserResult = await pool.query(
        'INSERT INTO "Login" (email, full_name, google_id, is_active, is_admin, profile_picture) VALUES ($1, $2, $3, true, false, $4) RETURNING *',
        [userData.email, userData.name, userData.id, userData.picture]
      );
      user = newUserResult.rows[0];
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        email: user.email,
        full_name: user.full_name,
        is_admin: user.is_admin || false,
        profile_picture: user.profile_picture || userData.picture
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '24h' }
    );
    
    // Redirect to frontend with token
    return res.redirect(`${process.env.FRONTEND_URL || 'https://harp-website.vercel.app'}?token=${token}`);
  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'https://harp-website.vercel.app'}/login?error=server_error`);
  }
}