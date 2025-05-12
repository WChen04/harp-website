import { corsHeaders, handleCors } from '../utils/cors.js';
import { query } from '../utils/db.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

export default async function handler(req, res) {
  // CORS setup...
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);

  // Handle preflight
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Parse JSON body manually
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    const { email, password } = body;

    // Query user
    const { rows } = await query(
      'SELECT * FROM "Login" WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    const token = jwt.sign(
      {
        email: user.email,
        full_name: user.full_name,
        is_admin: user.is_admin || false
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: '24h' }
    );

    await query(
      'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
      [email]
    );

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        is_admin: user.is_admin || false
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || "Authentication failed" });
  }
}
