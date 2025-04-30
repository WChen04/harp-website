import { query } from '../../utils/db.js';
import { corsHeaders, handleCors } from '../../utils/cors'; 

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { query: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim() === "") {
      // No search, return all articles
      const { rows } = await query(
        'SELECT id, title, intro, date, read_time, link, "TopStory" FROM "Articles" ORDER BY date DESC'
      );
      return res.status(200).json({ success: true, data: rows });
    }

    // Full-text search
    const { rows } = await query(
      `SELECT id, title, intro, date, read_time, link, "TopStory"
       FROM "Articles"
       WHERE search_vector @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC, date DESC`,
      [searchQuery]
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Search for "${searchQuery}" returned ${rows.length} results`);
    }

    return res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      success: false,
      error: "Search failed",
      details: error.message,
    });
  }
}
