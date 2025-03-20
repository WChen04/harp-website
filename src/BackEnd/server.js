import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pg from 'pg';
import dotenv from 'dotenv';
 dotenv.config({ path: '../../.env' });

const app = express();
const port = process.env.PORT || 5000;
const { Pool } = pg;

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
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

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
                profile_picture TEXT
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
                // Update existing user
                await pool.query(
                    'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP, google_id = $1, is_active = true WHERE email = $2',
                    [profile.id, profile.emails[0].value]
                );
                return done(null, rows[0]);
            }

            // Create new user
            const newUser = await pool.query(
                'INSERT INTO "Login" (email, full_name, google_id, is_active) VALUES ($1, $2, $3, true) RETURNING *',
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
        // Include user data in the redirect URL
        const userData = encodeURIComponent(JSON.stringify({
            email: req.user.email,
            full_name: req.user.full_name,
            profile_picture: req.user.profile_picture_data
        }));
        
        // Redirect to frontend with user data as URL parameter
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}/?userData=${userData}`);
    }
);

// Add a new endpoint to check auth status
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            email: req.user.email,
            full_name: req.user.full_name,
            profile_picture: req.user.profile_picture_data
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
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

app.get('/', (req, res) => {
    res.json({ message: 'Backend is running' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;