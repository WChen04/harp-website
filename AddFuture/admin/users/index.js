import { query } from '../../../utils/db';
import { authenticateJWT } from '../../../utils/auth';
import { corsHeaders, handleCors } from '../../../utils/cors'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await authenticateJWT(req);
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { rows } = await query(
      'SELECT email, full_name, is_admin, profile_picture FROM "Login" ORDER BY full_name'
    );

    return res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users', details: error.message });
  }
}
