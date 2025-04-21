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
    const user = await authenticateJWT(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { rows } = await pool.query(
      'SELECT email, full_name, profile_picture, is_admin FROM "Login" WHERE email = $1',
      [user.email]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user data
    return res.status(200).json(rows[0]);
    
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}