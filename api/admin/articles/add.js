import { pool, authenticateJWT, corsHeaders, handleCors } from '../../_config';
import multer from 'multer';
import { createRouter, expressWrapper } from 'next-connect';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Create router
const router = createRouter();

// Add middleware to handle file uploads
router.use(expressWrapper(upload.single('image')));

// Add post handler
router.post(async (req, res) => {
  try {
    // Verify admin rights
    const user = await authenticateJWT(req);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const client = await pool.connect();

    try {
      // Start a transaction
      await client.query("BEGIN");

      // Extract article data
      const { title, intro, date, read_time, link, TopStory } = req.body;

      // Insert article first
      const articleResult = await client.query(
        'INSERT INTO "Articles" (title, intro, date, read_time, link, "TopStory") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [
          title,
          intro,
          date,
          read_time,
          link,
          TopStory === "true" || TopStory === true,
        ]
      );

      const articleId = articleResult.rows[0].id;

      // Handle image if uploaded
      if (req.file) {
        await client.query(
          'INSERT INTO "ArticleImages" (article_id, image_data, image_mimetype) VALUES ($1, $2, $3)',
          [articleId, req.file.buffer, req.file.mimetype]
        );
      }

      // Commit the transaction
      await client.query("COMMIT");

      return res.status(201).json({ 
        id: articleId, 
        message: "Article added successfully" 
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await client.query("ROLLBACK");
      console.error("Error adding article:", error);
      return res.status(500).json({ 
        error: "Failed to add article", 
        details: error.message 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Export handler function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  
  // Handle CORS preflight request
  if (handleCors(req, res)) return;

  // Run the router
  await router.run(req, res);
}

// Configure multer to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};