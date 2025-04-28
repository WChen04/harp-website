import { corsHeaders, handleCors } from '@/api/_config';
import {authenticateJWT} from '@/utils/auth'

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
    const user = await authenticateJWT(req);

    if (user) {
      return res.status(200).json({ success: true, authenticated: true });
    } else {
      return res.status(401).json({ success: false, authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
}
