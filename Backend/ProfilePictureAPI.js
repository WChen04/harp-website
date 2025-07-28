import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadFile, deleteFile, generateBlobUrl } from "./azureStorage.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TEMP STORAGE for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'temp-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpeg, .png and .gif files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 2 },
    fileFilter
});

const DEFAULT_BLOB_NAME = 'default-profile.png';
const DEFAULT_CONTAINER = 'profileimages';

export default (pool) => {

    // Upload profile picture
    router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Step 1: Get current blob name
            const result = await pool.query(
                'SELECT blob_name FROM "Login" WHERE email = $1',
                [req.user.email]
            );
            const currentBlob = result.rows[0]?.blob_name;

            // Step 2: Delete old blob from Azure if it exists
            if (currentBlob) {
                const deleted = await deleteFile(currentBlob, DEFAULT_CONTAINER);
                console.log(`🗑️ Deleted old blob: ${currentBlob} - Success: ${deleted}`);
            }

            // Step 3: Upload new file
            const fileBuffer = fs.readFileSync(req.file.path);
            const { blobName, url } = await uploadFile(
                fileBuffer,
                req.file.originalname,
                req.file.mimetype,
                DEFAULT_CONTAINER
            );

            // Step 4: Update DB with new blobName
            await pool.query(
                'UPDATE "Login" SET blob_name = $1 WHERE email = $2',
                [blobName, req.user.email]
            );

            // Step 5: Clean up local file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.json({
                message: 'Profile picture uploaded successfully',
                profilePicture: url
            });

        } catch (error) {
            console.error('Profile picture upload error:', error);

            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(500).json({
                error: 'Failed to update profile picture',
                details: error.message
            });
        }
    });

    // Get user info + profile picture
    router.get('/user', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const result = await pool.query(
                'SELECT email, full_name, blob_name FROM "Login" WHERE email = $1',
                [req.user.email]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = result.rows[0];
            const blobName = user.blob_name || DEFAULT_BLOB_NAME;
            const profile_picture = generateBlobUrl(blobName, DEFAULT_CONTAINER);

            res.json({
                email: user.email,
                fullName: user.full_name,
                profile_picture
            });
        } catch (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Auth check
    router.get('/auth-check', (req, res) => {
        if (req.isAuthenticated()) {
            return res.status(200).json({ authenticated: true });
        } else {
            return res.status(401).json({ authenticated: false });
        }
    });

    return router;
};
