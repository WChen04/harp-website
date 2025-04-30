import { corsHeaders, handleCors } from '../../../utils/cors';
import { query } from '../../../utils/db';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);

  // Handle CORS preflight
  if (handleCors(req, res)) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    console.log(`Fetching image for team_member_id: ${id}`);

    const result = await query(
      "SELECT image_data, mime_type FROM team_member_images WHERE team_member_id = $1",
      [id]
    );

    if (result.rows.length > 0) {
      const { image_data, mime_type } = result.rows[0];
      
      // Set content type header
      res.setHeader("Content-Type", mime_type || "image/png");
      
      // For binary data, we need to return it properly
      return res.status(200).send(Buffer.from(image_data));
    } else {
      return res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}