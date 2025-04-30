import { corsHeaders, handleCors } from '../../utils/cors';
import { authenticateJWT } from '../../utils/auth'
import { query } from '../../utils/db';
import multer from 'multer';
import { createRouter, expressWrapper } from 'next-connect'; 

// Configure multer for in-memory storage (no filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .png, and .gif files are allowed!'), false);
    }
  }
});

// Create a next-connect router
const router = createRouter();

// Middleware to handle file upload
router.use(expressWrapper(upload.single('profilePicture')));

// Handle POST upload
router.post(async (req, res) => {
  try {
    // Authenticate the user
    const user = await authenticateJWT(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimetype = req.file.mimetype;

    // Update user profile picture in the database
    await query(
      `UPDATE "Login"
       SET profile_picture_data = $1, 
           profile_picture_type = $2
       WHERE email = $3`,
      [base64Image, mimetype, user.email]
    );

    const dataUrl = `data:${mimetype};base64,${base64Image}`;

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: dataUrl
    });

  } catch (error) {
    console.error('Profile upload error:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload profile picture', details: error.message });
  }
});

// Export the handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);

  if (handleCors(req, res)) return;

  await router.run(req, res);
}

// Important: disable default bodyParser, since multer handles multipart/form-data
export const config = {
  api: {
    bodyParser: false
  }
};
