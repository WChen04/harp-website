import { pool, authenticateJWT, corsHeaders, handleCors } from './_config';

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
    // Check JWT authentication
    const jwtUser = await authenticateJWT(req);
    
    if (jwtUser) {
      // If JWT authentication successful, return user data
      return res.status(200).json({
        email: jwtUser.email,
        full_name: jwtUser.full_name,
        profile_picture: jwtUser.profile_picture,
        is_admin: jwtUser.is_admin || false,
      });
    }
    
    // If no JWT or JWT invalid, return unauthorized
    return res.status(401).json({ error: "Not authenticated" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}