import dotenv from "dotenv";
dotenv.config();


// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || "https://www.harpresearch.ai",
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

// Helper function to handle CORS preflight requests
const handleCors = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return true;
  }
  return false;
};

export { pool, authenticateJWT, corsHeaders, handleCors };