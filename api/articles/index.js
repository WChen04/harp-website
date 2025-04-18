import { pool, corsHeaders, handleCors } from '../_config';

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
    const articlesResult = await pool.query(
      'SELECT id, title, intro, date, read_time, link, "TopStory" FROM "Articles"'
    );
    return res.status(200).json(articlesResult.rows);
  } catch (error) {
    console.error("Error in /articles route:", error);
    return res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
}