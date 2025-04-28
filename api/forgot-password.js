import { query } from '@/utils/db';
import { corsHeaders, handleCors } from './config';
import crypto from 'crypto';

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
    const { email } = req.body;

    console.log('Received forgot password request for email:', email);

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if user exists
    console.log('Querying database for user...');
    const userResult = await query(
      'SELECT * FROM "Login" WHERE email = $1',
      [email]
    );
    console.log('User query completed. Rows found:', userResult.rows.length);

    if (userResult.rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(404).json({ success: false, error: 'No account found with this email' });
    }

    // Generate reset token
    console.log('Generating reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiry to exactly 1 hour from now
    console.log('Updating user with reset token...');
    const updateResult = await query(
      `UPDATE "Login" 
       SET reset_token = $1, 
           reset_token_expiry = CURRENT_TIMESTAMP + INTERVAL '1 hour'
       WHERE email = $2
       RETURNING reset_token_expiry`,
      [resetToken, email]
    );
    console.log('Update completed. Rows affected:', updateResult.rowCount);

    // Generate reset link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password/${resetToken}`;

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully',
      resetLink: resetLink
    });

  } catch (error) {
    console.error('Detailed error in forgot-password:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
