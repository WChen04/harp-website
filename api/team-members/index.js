import { corsHeaders, handleCors } from '../../utils/cors.js';
import { query } from '../../utils/db.js';

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
    let searchQuery = `SELECT * FROM team_members`;
    const queryParams = [];

    if (req.query.semester) {
      // Handle both cases: member_type filter or semester filter
      if (
        req.query.semester === "Developer" ||
        req.query.semester === "Researcher"
      ) {
        searchQuery += ` WHERE member_type = $1`;
        queryParams.push(req.query.semester);
      } else if (
        req.query.semester === "Fall 2024" ||
        req.query.semester === "Spring 2025"
      ) {
        searchQuery += ` WHERE semester = $1`;
        queryParams.push(req.query.semester);
      } else {
        return res.status(400).json({ success: false, error: "Invalid semester value" });
      }
    }

    searchQuery += ` ORDER BY 
      CASE WHEN founder = true THEN 0 ELSE 1 END,
      CASE 
        WHEN role = 'CEO, Vice President of Core Research' THEN 1
        WHEN role LIKE 'Vice President%' THEN 2
        WHEN role = 'Marketing Manager' THEN 3
        WHEN role LIKE 'Project Manager%' THEN 4
        ELSE 5
      END, 
      role ASC,
      name ASC`;

    const result = await query(searchQuery, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return res.status(500).json({ error: error.message });
  }
}