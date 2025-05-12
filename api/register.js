import { query } from '../utils/db.js';
import { corsHeaders, handleCors } from '../utils/cors.js';
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
    const { email, password, fullName } = req.body;

    console.log('Registration attempt:', {
      email,
      fullName,
      passwordLength: password?.length
    });

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Attempting database insertion...');
    const result = await query(
      'INSERT INTO "Login" (email, password, full_name) VALUES ($1, $2, $3) RETURNING email, full_name, created_at',
      [email, hashedPassword, fullName]
    );
    console.log('Database insertion successful:', result.rows[0]);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Detailed registration error:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      stack: error.stack
    });

    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
}
