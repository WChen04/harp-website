import { corsHeaders, handleCors } from '@/api/_config';
import {authenticateJWT} from '@/utils/auth'
import { query } from '@/utils/db';

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
    // Authenticate the user
    const user = await authenticateJWT(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Fetch the user's profile info from the database
    const result = await query(
      `SELECT email, full_name, profile_picture_data, profile_picture_type
       FROM "Login"
       WHERE email = $1`,
      [user.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = result.rows[0];

    // Build a full data URL if a profile picture exists
    let profilePicture = null;
    if (userData.profile_picture_data && userData.profile_picture_type) {
      profilePicture = `data:${userData.profile_picture_type};base64,${userData.profile_picture_data}`;
    }

    return res.status(200).json({
      success: true,
      user: {
        email: userData.email,
        full_name: userData.full_name,
        profilePicture: profilePicture
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile', details: error.message });
  }
}
