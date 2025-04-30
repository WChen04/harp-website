import {  corsHeaders, handleCors } from '../../utils/cors';
import { query } from '../../utils/db';

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
    console.log('Executing query: SELECT * FROM "Articles" WHERE "TopStory" = TRUE ORDER BY date DESC');

    const topStoriesResult = await query(
      'SELECT * FROM "Articles" WHERE "TopStory" = TRUE ORDER BY date DESC'
    );

    // Log details of retrieved top stories
    console.log(`Retrieved ${topStoriesResult.rows.length} top stories`);

    return res.status(200).json(topStoriesResult.rows);
  } catch (error) {
    console.error("Detailed error in /articles/top route:", error);
    return res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
}