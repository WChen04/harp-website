import { Pool } from 'pg';

let pool;

// Initialize pool once for serverless functions (avoids exhausting clients)
if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 5, // Low pool size for serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
