import { query } from '@/utils/db';
import { corsHeaders, handleCors } from '@/utils/cors';
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
    const { provider } = req.query;    // <-- Notice: req.query
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUserResult = await query(
      'SELECT * FROM "Login" WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'User already registered, logged in successfully',
        user: {
          email: existingUserResult.rows[0].email,
          full_name: existingUserResult.rows[0].full_name,
          created_at: existingUserResult.rows[0].created_at
        }
      });
    }

    // Generate random secure password
    const randomPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Insert new social user
    const newUserResult = await query(
      'INSERT INTO "Login" (email, password, full_name) VALUES ($1, $2, $3) RETURNING email, full_name, created_at',
      [email, hashedPassword, fullName]
    );

    return res.status(201).json({
      success: true,
      message: 'Social registration successful',
      user: newUserResult.rows[0]
    });

  } catch (error) {
    console.error(`Social registration error for ${req.query.provider}:`, error);
    return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
}
