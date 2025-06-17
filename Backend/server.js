import express from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = process.env.NODE_ENV === "production"
  ? path.resolve(__dirname, ".env.production")
  : path.resolve(__dirname, ".env.local");

dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 5000;
const { Pool } = pg;

// Database configuration
const dbConnectionString = process.env.DATABASE_URL;
if (!dbConnectionString) {
  console.error(
    "ERROR: No database connection string found in environment variables"
  );
  console.error("Please set either API_URL or DATABASE_URL in your .env file");
}

const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const pgSession = connectPgSimple(session);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://harp-website.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    admin: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
    store: new pgSession({
      pool: pool, // Use the PostgreSQL pool
      tableName: "session", // Use a custom session table name (default is "session")
      createTableIfMissing: true, // Automatically creates the session table if it doesn't exist
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Database connection verification
pool.query("SELECT NOW()", (err, res) => {
  console.log("Verifying database connection...");
  if (err) {
    console.error("Database connection error:", err.message);
    console.error("Error code:", err.code);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});

// Initialize database
const initializeDatabase = async () => {
  try {
    // Login table (existing code)
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

    // Articles table (existing code)
    const createArticlesTableQuery = `
            CREATE TABLE IF NOT EXISTS "public"."Articles" (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                intro TEXT,
                content TEXT,
                date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                read_time TEXT,
                link TEXT,
                "TopStory" BOOLEAN DEFAULT FALSE,
                search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english'::regconfig, (((title)::text || ' '::text) || intro))) STORED
            );
        `;
    await pool.query(createArticlesTableQuery);

    // New ArticleImages table
    const createArticleImagesTableQuery = `
            CREATE TABLE IF NOT EXISTS "public"."ArticleImages" (
                id SERIAL PRIMARY KEY,
                article_id INTEGER NOT NULL,
                image_data BYTEA NOT NULL,
                image_mimetype VARCHAR(100) NOT NULL,
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES "public"."Articles"(id) ON DELETE CASCADE
            );
        `;
    await pool.query(createArticleImagesTableQuery);

    // Create index on article_id in ArticleImages table
    const createArticleImagesIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_article_images_article_id 
            ON "public"."ArticleImages"(article_id);
        `;
    await pool.query(createArticleImagesIndexQuery);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

initializeDatabase();

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM "Login" WHERE email = $1',
      [user.email]
    );

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
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/auth/google/callback",
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
  )
);

// Import traditional login routes
import loginRoutes from "./LoginAPI.js";
import profileRoutes from "./ProfilePictureAPI.js";
app.use("/api", loginRoutes(pool));
app.use("/api", profileRoutes(pool));

// OAuth routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect:
      process.env.FRONTEND_URL + "/login" || "http://localhost:5174/login",
    failureFlash: true,
  }),
  (req, res) => {
    // Redirect to frontend with user data as URL parameter
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5174"}`);
  }
);

// Add a new endpoint to check auth status
app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      email: req.user.email,
      full_name: req.user.full_name,
      profile_picture: req.user.profile_picture,
      is_admin: req.user.is_admin,
    });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.get("/api/me", (req, res) => {
  // Check if user is authenticated
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Return user data (omit sensitive info)
  return res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    profile_picture: req.user.profile_picture,
    is_admin: req.user.is_admin || false,
  });
});

// Logout route
app.get("/api/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    // Return JSON instead of redirecting
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

// Article routes
app.get("/articles", async (req, res) => {
  console.log("Received GET request to /articles");
  try {
    console.log("Attempting to query database");
    const articlesResult = await pool.query(
      'SELECT id, title, intro, date, read_time, link, "TopStory" FROM "Articles"'
    );
    console.log(
      `Query successful. Retrieved ${articlesResult.rows.length} articles`
    );
    res.json(articlesResult.rows);
  } catch (error) {
    console.error("Detailed error in /articles route:", error);
    res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
});

//Retrieve Articles Image
app.get("/articles/:id/image", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch image for specific article
    const result = await pool.query(
      'SELECT image_data, image_mimetype FROM "ArticleImages" WHERE article_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No image found" });
    }

    const { image_data, image_mimetype } = result.rows[0];

    res.contentType(image_mimetype);
    res.send(image_data);
  } catch (error) {
    console.error("Error retrieving image:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve image", details: error.message });
  }
});

app.get("/articles/top", async (req, res) => {
  console.log("Received GET request to /articles/top");
  try {
    console.log(
      'Executing query: SELECT * FROM "Articles" WHERE "TopStory" = TRUE ORDER BY date DESC'
    );

    const topStoriesResult = await pool.query(
      'SELECT * FROM "Articles" WHERE "TopStory" = TRUE ORDER BY date DESC'
    );

    // Log full details of each row
    topStoriesResult.rows.forEach((row, index) => {
      console.log(`Top Story ${index + 1}:`, JSON.stringify(row, null, 2));
      console.log(
        `TopStory value type: ${typeof row.TopStory}, value: ${row.TopStory}`
      );
    });

    console.log(`Retrieved ${topStoriesResult.rows.length} top stories`);

    res.json(topStoriesResult.rows);
  } catch (error) {
    console.error("Detailed error in /articles/top route:", error);
    res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
});

app.get("/articles/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      // Return all articles if no query provided
      const { rows } = await pool.query(
        'SELECT id, title, intro, date, read_time, link, "TopStory" FROM "Articles" ORDER BY date DESC'
      );
      return res.json(rows);
    }

    // Using the search_vector for full-text search
    const { rows } = await pool.query(
      `SELECT id, title, intro, date, read_time, link, "TopStory" 
             FROM "Articles" 
             WHERE search_vector @@ plainto_tsquery('english', $1)
             ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC, 
                      date DESC`,
      [query]
    );

    console.log(`Search for "${query}" returned ${rows.length} results`);
    res.json(rows);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
});

app.delete('/articles/:id', async (req, res) => {
  const articleId = req.params.id;

  try {
    const success = await deleteArticleById(articleId); // You define this function

    if (!success) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ message: `Article ${articleId} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
});

async function deleteArticleById(id) {
  try {
    const result = await pool.query('DELETE FROM "Articles" WHERE id = $1', [id]);
    return result.rowCount > 0; // true if article was deleted
  } catch (error) {
    console.error('Error in deleteArticleById:', error);
    throw error;
  }
}

app.patch('/articles/:id/toggle-top', async (req, res) => {
  const articleId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE "Articles"
       SET "TopStory" = NOT "TopStory"
       WHERE id = $1
       RETURNING *`,
      [articleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ message: 'Top story status updated', article: result.rows[0] });
  } catch (err) {
    console.error('Error toggling topStory:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API Endpoint to fetch all team member information from the team_members table (organized by role)
app.get("/api/team-members", async (req, res) => {
  try {
    let query = `SELECT * FROM team_members`;
    const queryParams = [];

    if (req.query.semester) {
      // Handle both cases: member_type filter or semester filter
      if (
        req.query.semester === "Developer" ||
        req.query.semester === "Researcher"
      ) {
        query += ` WHERE member_type = $1`;
        queryParams.push(req.query.semester);
      } else if (
        req.query.semester === "Fall 2024" ||
        req.query.semester === "Spring 2025"
      ) {
        query += ` WHERE semester = $1`;
        queryParams.push(req.query.semester);
      }
    }

    query += ` ORDER BY 
      CASE WHEN founder = true THEN 0 ELSE 1 END,
      CASE 
        WHEN role = 'CEO, Vice President of Core Research' THEN 1
        WHEN role LIKE 'Vice President%' THEN 2
        WHEN role = 'Marketing Manager' THEN 3
        WHEN role LIKE 'Project Manager%' THEN 4
        ELSE 5
      END, 
      role ASC,
      name ASC`;

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to fetch team member profile images from the team_member_images table
// Note: This assumes that the images are stored as binary data in the database.
// Refer to convert_images.py to see how images are converted to binary data and stored in the database.
app.get("/api/team-member-image/:id", async (req, res) => {
  try {
    const memberId = req.params.id;
    console.log(`Fetching image for team_member_id: ${memberId}`);

    const result = await pool.query(
      "SELECT image_data, mime_type FROM team_member_images WHERE team_member_id = $1",
      [memberId]
    );

    if (result.rows.length > 0) {
      const { image_data, mime_type } = result.rows[0];
      res.setHeader("Content-Type", mime_type || "image/png");
      res.send(image_data);
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//Admin only Routes:

import multer from "multer";
import adminRoutes from "./AdminAPI.js";
import AboutAPI from "./AboutAPI.js"

app.use("/api", adminRoutes(pool));
app.use("/api", AboutAPI(pool));

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

app.post("/admin/articles/add", upload.single("image"), async (req, res) => {
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

    res
      .status(201)
      .json({ id: articleId, message: "Article added successfully" });
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query("ROLLBACK");
    console.error("Error adding article:", error);
    res
      .status(500)
      .json({ error: "Failed to add article", details: error.message });
  } finally {
    client.release();
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

export default app;
