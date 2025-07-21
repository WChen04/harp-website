import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadFile, deleteFile, generateBlobUrl } from "./services/azureStorage.js";


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create a temporary directory for uploads
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'temp-' + uniqueSuffix + ext);
    }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpeg, .png and .gif files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 2 // 2MB limit
    },
    fileFilter: fileFilter
});

// Ensure the database has the necessary columns
const ensureColumns = async (pool) => {
    try {
        // Check if columns exist
        const checkColumns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Login' AND column_name IN ('profile_picture_data', 'profile_picture_type')
        `);

        const existingColumns = checkColumns.rows.map(row => row.column_name);
        
        // Add missing columns
        if (!existingColumns.includes('profile_picture_data')) {
            await pool.query(`ALTER TABLE "Login" ADD COLUMN profile_picture_data TEXT`);
            console.log('Added profile_picture_data column');
        }
        
        if (!existingColumns.includes('profile_picture_type')) {
            await pool.query(`ALTER TABLE "Login" ADD COLUMN profile_picture_type TEXT`);
            console.log('Added profile_picture_type column');
        }
        
        console.log('Database columns verified');
    } catch (error) {
        console.error('Error ensuring columns:', error);
    }
};

export default (pool) => {
    // Ensure columns exist when the module is loaded
    ensureColumns(pool);
    
    // Upload profile picture endpoint
    router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            
            // Read the file into a buffer
            const fileBuffer = fs.readFileSync(req.file.path);
            
            const { blobName, url } = await uploadFile(fileBuffer, req.file.originalname, req.file.mimetype);
            
            // Create a data URL for the response
            await pool.query(
                'UPDATE "Login" SET profile_picture_data = $1, profile_picture_type = $2 WHERE email = $3',
                [blobName, req.file.mimetype, req.user.email]
            );
            
            console.log('Attempting to update profile picture for user:', req.user.email);
            
            // Delete the temporary file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            return res.json({
                message: 'Profile picture uploaded successfully',
                profilePicture: url
            });
        } catch (error) {
            console.error('Profile picture upload error:', error);
            
            // Clean up the temporary file if it exists
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting temporary file:', unlinkError);
                }
            }
            
            return res.status(500).json({
                error: 'Failed to update profile picture',
                details: error.message
            });
        }
    });

    // Get user profile endpoint
    router.get('/user', async (req, res) => {
        if (req.isAuthenticated()) {
            try {
                // Get the latest user data from the database
                const result = await pool.query(
                    'SELECT email, full_name, profile_picture_data, profile_picture_type FROM "Login" WHERE email = $1',
                    [req.user.email]
                );
                
                if (result.rows.length > 0) {
                    const userData = result.rows[0];   

                    if (userData.profile_picture_data) {
                        // Treat profile_picture_data as the blob name stored earlier
                        userData.profile_picture = generateBlobUrl(userData.profile_picture_data);
                    }

                    // Optionally remove blob name and mime type from response
                    delete userData.profile_picture_data;
                    delete userData.profile_picture_type;

                    res.json(userData);

                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                res.status(500).json({ error: 'Failed to fetch user data' });
            }
        } else {
            // Fixed: No undefined error variable here
            console.error('User not authenticated');
            return res.status(401).json({ 
                error: 'Not authenticated',
                details: 'User must be logged in to access this resource' 
            });
        }
    });

    router.get('/auth-check', (req, res) => {
        if (req.isAuthenticated()) {
        return res.status(200).json({ authenticated: true });
        } else {
        return res.status(401).json({ authenticated: false });
        }
    });
    
    return router;
};