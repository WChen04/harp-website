import { query } from '@/utils/db';
import { authenticateJWT, corsHeaders, handleCors } from '@/utils/auth';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  if (handleCors(req, res)) return;

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = await authenticateJWT(req);
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { email } = req.query;

    if (email === user.email) {
      return res.status(400).json({ success: false, error: 'Cannot change your own admin status' });
    }

    const currentStatusResult = await query(
      'SELECT is_admin FROM "Login" WHERE email = $1',
      [email]
    );

    if (currentStatusResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const newStatus = !currentStatusResult.rows[0].is_admin;

    await query(
      'UPDATE "Login" SET is_admin = $1 WHERE email = $2',
      [newStatus, email]
    );

    return res.status(200).json({
      success: true,
      data: {
        email,
        is_admin: newStatus,
        message: `Admin status ${newStatus ? 'granted to' : 'removed from'} user`
      }
    });

  } catch (error) {
    console.error('Error updating admin status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update admin status', details: error.message });
  }
}
