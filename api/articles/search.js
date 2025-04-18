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
    const { query } = req.query;
    if (!query || query.trim() === "") {
      // Return all articles if no query provided
      const { rows } = await pool.query(
        'SELECT id, title, intro, date, read_time, link, "TopStory" FROM "Articles" ORDER BY date DESC'
      );
      return res.status(200).json(rows);
    }

    // Using the search_vector for full-text search
    const { rows } = await pool.query(
      `SELECT id, title, intro, date, read_time, link, "TopStory" 
       FROM "Articles" 
       WHERE search_vector @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC, 
                date DESC`,
      [query]
    );

    console.log(`Search for "${query}" returned ${rows.length} results`);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
}