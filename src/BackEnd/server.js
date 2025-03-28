import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pg from 'pg';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
 dotenv.config({ path: '../../.env' });

const app = express();
const port = process.env.PORT || 5000;
const { Pool } = pg;

// Database configuration
const dbConnectionString = process.env.DATABASE_URL;
if (!dbConnectionString) {
    console.error("ERROR: No database connection string found in environment variables");
    console.error("Please set either API_URL or DATABASE_URL in your .env file");
}

const pool = new Pool({
    connectionString: dbConnectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

const pgSession = connectPgSimple(session);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    admin: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    },
    store: new pgSession({
        pool: pool,                // Use the PostgreSQL pool
        tableName: 'session',      // Use a custom session table name (default is "session")
        createTableIfMissing: true // Automatically creates the session table if it doesn't exist
      })
}));

app.use(passport.initialize());
app.use(passport.session());



// Database connection verification
pool.query('SELECT NOW()', (err, res) => {
    console.log("Verifying database connection...");
    if (err) {
        console.error('Database connection error:', err.message);
        console.error('Error code:', err.code);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

// Initialize database
const initializeDatabase = async () => {
    try {
        // Login table
        // In your initializeDatabase function, modify the createLoginTableQuery:
        const createLoginTableQuery = `
            CREATE TABLE IF NOT EXISTS "public"."Login" (
                email TEXT PRIMARY KEY,
                password TEXT,
                full_name TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT true,
                reset_token TEXT,
                reset_token_expiry TIMESTAMP WITH TIME ZONE,
                google_id TEXT,
                profile_picture TEXT,
                is_admin BOOLEAN DEFAULT false
            );
        `;
        await pool.query(createLoginTableQuery);
        
        // Make sure articles table exists too
        const checkArticlesTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'articles'
            );
        `;
        const tableExists = await pool.query(checkArticlesTableQuery);
        
        if (!tableExists.rows[0].exists) {
            const createArticlesTableQuery = `
                CREATE TABLE IF NOT EXISTS "public"."articles" (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    intro TEXT,
                    content TEXT,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    "TopStory" BOOLEAN DEFAULT FALSE
                );
            `;
            await pool.query(createArticlesTableQuery);
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

initializeDatabase();

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser(async (user, done) => {
    try {
        const { rows } = await pool.query('SELECT * FROM "Login" WHERE email = $1', [user.email]);

        if (rows.length === 0) {
            console.log("User not found in DB");
            return done(null, false);
        }
        
        // Include admin status in the user object
        done(null, rows[0]);
    } catch (error) {
        console.error("Deserialization error:", error);
        done(error);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM "Login" WHERE email = $1 OR google_id = $2',
                [profile.emails[0].value, profile.id]
            );

            if (rows.length) {
                // Update existing user but preserve admin status
                await pool.query(
                    'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP, google_id = $1, is_active = true WHERE email = $2',
                    [profile.id, profile.emails[0].value]
                );
                return done(null, rows[0]);
            }

            // Create new user (non-admin by default)
            const newUser = await pool.query(
                'INSERT INTO "Login" (email, full_name, google_id, is_active, is_admin) VALUES ($1, $2, $3, true, false) RETURNING *',
                [profile.emails[0].value, profile.displayName, profile.id]
            );

            return done(null, newUser.rows[0]);
        } catch (error) {
            return done(error);
        }
    }
));

// Import traditional login routes
import loginRoutes from '../components/Login/LoginAPI.js';
import profileRoutes from '../components/Profile/ProfilePictureAPI.js';
app.use('/api', loginRoutes(pool));
app.use('/api', profileRoutes(pool));

// OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: process.env.FRONTEND_URL + '/login' || 'http://localhost:5174/login',
        failureFlash: true 
    }),
    (req, res) => {
        // Redirect to frontend with user data as URL parameter
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
    }
);

// Add a new endpoint to check auth status
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            email: req.user.email,
            full_name: req.user.full_name,
            profile_picture: req.user.profile_picture,
            is_admin: req.user.is_admin
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.get('/api/me', (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  
    // Return user data (omit sensitive info)
    return res.json({
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      profile_picture: req.user.profile_picture,
      is_admin: req.user.is_admin || false
    });
  });

// Logout route
app.get('/api/logout', (req, res) => {
    req.logout(function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      // Return JSON instead of redirecting
      return res.status(200).json({ message: 'Logged out successfully' });
    });
});

// Article routes
app.get('/articles', async (req, res) => {
    console.log('Received GET request to /articles');
    try {
        console.log('Attempting to query database');
        const { rows } = await pool.query('SELECT * FROM articles ORDER BY date DESC');
        console.log(`Query successful. Retrieved ${rows.length} articles`);
        res.json(rows);
    } catch (error) {
        console.error('Detailed error in /articles route:', error);
        res.status(500).json({
            error: 'Database error',
            details: error.message
        });
    }
});

app.get('/articles/top', async (req, res) => {
    console.log('Received GET request to /articles/top');
    try {
        console.log('Attempting to query database for top stories');
        const { rows } = await pool.query('SELECT * FROM articles WHERE "TopStory" = TRUE ORDER BY date DESC');
        console.log(`Query successful. Retrieved ${rows.length} top stories`);
        res.json(rows);
    } catch (error) {
        console.error('Detailed error in /articles/top route:', error);
        res.status(500).json({
            error: 'Database error',
            details: error.message
        });
    }
});

app.get('/articles/search', async (req, res) => {
    try {
        const { query } = req.query;
        const { rows } = await pool.query(
            `SELECT * FROM articles 
            WHERE title ILIKE $1 OR intro ILIKE $1
            ORDER BY date DESC`,
            [`%${query}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

//Admin only Routes:

import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/admin/articles/add', upload.single('image'), async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        // Access form data
        const { title, intro, date, read_time, link, TopStory } = req.body;
        //let image_url;
        
        // Handle file upload if using multer
        // if (req.file) {
        //     // If using multer for file uploads
        //     const fileName = `${Date.now()}-${req.file.originalname}`;
        //     const uploadPath = path.join(__dirname, '../../assets/HARPResearchLockUps/Photos/', fileName);
            
        //     // Save file
        //     fs.writeFileSync(uploadPath, req.file.buffer);
        //     image_url = `/assets/HARPResearchLockUps/Photos/${fileName}`;
        // } 
        // // Or handle base64 image if that approach is used
        // else if (req.body.imageBase64) {
        //     const base64Data = req.body.imageBase64.split(';base64,').pop();
        //     const fileName = `${Date.now()}.png`;
        //     const uploadPath = path.join(__dirname, '../../assets/HARPResearchLockUps/Photos/', fileName);
            
        //     // Save base64 as file
        //     fs.writeFileSync(uploadPath, base64Data, {encoding: 'base64'});
        //     image_url = `/assets/HARPResearchLockUps/Photos/${fileName}`;
        // } else {
        //     return res.status(400).json({ error: 'No image provided' });
        // }
        
        // Insert into database
        // const result = await pool.query(
        //     'INSERT INTO "Articles" (title, intro, date, read_time, link, image_url, "TopStory") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        //     [title, intro, date, read_time, link, image_url, TopStory === 'true' || TopStory === true]
        // );
        
        //Test
        const result = await pool.query(
            'INSERT INTO "articles" (title, intro, date, read_time, link, image_url, "TopStory") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, intro, date, read_time, link, "vision_webp", TopStory === 'true' || TopStory === true]
        );
        
        // Return the new article
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding article:', error);
        res.status(500).json({ error: 'Failed to add article', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'Backend is running' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;