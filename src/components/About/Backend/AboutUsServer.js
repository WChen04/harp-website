import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const { Pool } = pkg;

const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // front-end access
app.use(express.json());

// PostgreSQL connection using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// API Endpoint to fetch all team members from the team_members table (organized by role)
app.get("/api/team-members", async (req, res) => {
  try {
    let query = `SELECT * FROM team_members`;
    const queryParams = [];
    
    if (req.query.semester) {
      // Handle both cases: member_type filter or semester filter
      if (req.query.semester === 'Developer' || req.query.semester === 'Researcher') {
        query += ` WHERE member_type = $1`;
        queryParams.push(req.query.semester);
      } else if (req.query.semester === 'Fall 2024' || req.query.semester === 'Spring 2025') {
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
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: error.message });
  }
});


// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully:', res.rows[0]);
  }
});

// testing api calls 
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});
app.get("/api/db-test", async (req, res) => {
  try {
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'team_members'
    `);
    
    const count = await pool.query(`SELECT COUNT(*) FROM team_members`);
    
    res.json({ 
      schema: tableInfo.rows,
      count: count.rows[0].count
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: error.message });
  }
});