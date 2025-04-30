import { query } from '../../utils/db';
import { corsHeaders, handleCors } from '../../utils/cors';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);

  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { token } = req.query;  
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if reset token is valid
    const userResult = await query(
      `SELECT * FROM "Login" 
       WHERE reset_token = $1 
       AND reset_token_expiry > CURRENT_TIMESTAMP`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await query(
      `UPDATE "Login" 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expiry = NULL 
       WHERE reset_token = $2`,
      [hashedPassword, token]
    );

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
}
