import { corsHeaders, handleCors } from '../../../utils/cors';
import {authenticateJWT} from '../../../utils/auth';
import { pool } from '../../../utils/db'; 
import multer from 'multer';
import { createRouter, expressWrapper } from 'next-connect';

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Router
const router = createRouter();
router.use(expressWrapper(upload.single('image')));

router.post(async (req, res) => {
  let client;

  try {
    // Authenticate
    const user = await authenticateJWT(req);
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }

    // Get a manual client connection
    client = await pool.connect();

    await client.query('BEGIN');

    const { title, intro, date, read_time, link, TopStory } = req.body;

    const articleResult = await client.query(
      'INSERT INTO "Articles" (title, intro, date, read_time, link, "TopStory") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [title, intro, date, read_time, link, TopStory === "true" || TopStory === true]
    );

    const articleId = articleResult.rows[0].id;

    if (req.file) {
      await client.query(
        'INSERT INTO "ArticleImages" (article_id, image_data, image_mimetype) VALUES ($1, $2, $3)',
        [articleId, req.file.buffer, req.file.mimetype]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({ success: true, id: articleId, message: "Article added successfully" });

  } catch (error) {
    console.error('Transaction error:', error);
    if (client) await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// Export handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  if (handleCors(req, res)) return;

  await router.run(req, res);
}

export const config = {
  api: { bodyParser: false },
};
