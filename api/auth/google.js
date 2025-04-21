import { corsHeaders, handleCors } from '../_config';

// This is a simple redirect to Google OAuth consent screen
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
    // Google OAuth2 configuration (use environment variables in production)
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.API_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    
    // Construct Google OAuth URL
    const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scope = encodeURIComponent('profile email');
    
    const authUrl = `${GOOGLE_AUTH_URL}?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    
    // Redirect user to Google's OAuth page
    return res.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth redirect error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}