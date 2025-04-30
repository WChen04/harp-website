import { corsHeaders, handleCors } from '../../../utils/cors';
import { query } from '../../../utils/db';
import { Buffer } from 'buffer';

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
    const { id } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, error: 'Invalid article id' });
    }

    // Fetch image for specific article
    const result = await query(
      'SELECT image_data, image_mimetype FROM "ArticleImages" WHERE article_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No image found" });
    }

    const { image_data, image_mimetype } = result.rows[0];

    res.setHeader('Content-Type', image_mimetype);
    return res.send(Buffer.from(image_data));
  } catch (error) {
    console.error("Error retrieving image:", error);
    return res.status(500).json({ 
      error: "Failed to retrieve image", 
      details: error.message 
    });
  }
}