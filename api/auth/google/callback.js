import { corsHeaders, handleCors } from '../../../utils/cors';
import { query } from '../../../utils/db'
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
    const { code } = req.query;
    
    if (!code) {
      console.error('No code provided in Google callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://harp-website.vercel.app'}/login?error=no_code`);
    }
    
    // Exchange the authorization code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenResponse = await axios.post(tokenUrl, {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.API_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    });
    
    // Fetch user data from Google
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const userResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`
      }
    });

    const googleUser = userResponse.data;
    
    let user;
    const { rows } = await query(
      'SELECT * FROM "Login" WHERE email = $1',
      [googleUser.email]
    );
    
    if (rows.length === 0) {
      // Create a new user if not found
      const newUserResult = await query(
        'INSERT INTO "Login" (email, full_name, profile_picture, oauth_provider) VALUES ($1, $2, $3, $4) RETURNING *',
        [googleUser.email, googleUser.name, googleUser.picture, 'google']
      );
      user = newUserResult.rows[0];
    } else {
      user = rows[0];
      
      // Update user info and last login
      await query(
        'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP, profile_picture = $1 WHERE email = $2',
        [googleUser.picture, googleUser.email]
      );
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
    
    // Prepare user data for frontend
    const userData = {
      email: user.email,
      full_name: user.full_name || googleUser.name,
      profile_picture: user.profile_picture || googleUser.picture,
      is_admin: user.is_admin || false
    };
    
    // Encode user data for URL transmission
    const userDataParam = encodeURIComponent(JSON.stringify(userData));
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || "https://harp-website.vercel.app";
    return res.redirect(`${frontendUrl}/login?token=${token}&user=${userDataParam}`);
    
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "https://harp-website.vercel.app";
    return res.redirect(`${frontendUrl}/login?error=Authentication%20failed`);
  }
}