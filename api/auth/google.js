import { corsHeaders, handleCors } from '../_config';

export default function handler(req, res) {
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

  // Build the Google OAuth URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  // Add required parameters
  googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.append('redirect_uri', process.env.GOOGLE_CALLBACK_URL || 
                                                   'https://your-vercel-domain.vercel.app/api/auth/google/callback');
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'email profile');
  googleAuthUrl.searchParams.append('prompt', 'select_account');
  
  // Add a state parameter to prevent CSRF attacks
  // In production, this should be a randomly generated token stored in the user's session
  googleAuthUrl.searchParams.append('state', Math.random().toString(36).substring(7));
  
  // Redirect to Google's OAuth page
  return res.redirect(googleAuthUrl.toString());
}