import express from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
                "TopStory" BOOLEAN DEFAULT FALSE
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
import loginRoutes from "../components/Login/LoginAPI.js";
import profileRoutes from "../components/Profile/ProfilePictureAPI.js";
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
    const { rows } = await pool.query(
      `SELECT * FROM articles 
            WHERE title ILIKE $1 OR intro ILIKE $1
            ORDER BY date DESC`,
      [`%${query}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

//Admin only Routes:

import multer from "multer";
import path from "path";
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
