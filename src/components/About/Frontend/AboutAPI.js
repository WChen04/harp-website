import express from "express";
import multer from "multer";

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log("Processing file:", file.originalname);
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      console.log("File rejected - not an image:", file.originalname);
      return cb(new Error("Only image files are allowed!"), false);
    }
    console.log("File accepted:", file.originalname);
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Create API routes for the About page
function AboutAPI(pool) {
  const router = express.Router();

  // Middleware to check if user is authenticated and is admin
  const isAdmin = (req, res, next) => {
    try {
      console.log("Auth check - request headers:", req.headers);
      console.log("Auth check - cookies:", req.cookies);
      console.log("Auth check - is authenticated:", req.isAuthenticated ? req.isAuthenticated() : "isAuthenticated not defined");
      console.log("Auth check - user:", req.user);
      
      // Temporarily bypass authentication for debugging
      // REMOVE THIS AFTER DEBUGGING!
      console.log("WARNING: Authentication check bypassed for debugging");
      return next();
      
      // Uncomment this when ready to enforce authentication
      /*
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        console.log("Failed authentication check");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      console.log("Auth check - is admin:", req.user.is_admin);
      if (!req.user.is_admin) {
        console.log("Failed admin check");
        return res.status(403).json({ error: "Not authorized" });
      }
      
      console.log("Auth checks passed");
      next();
      */
    } catch (error) {
      console.error("Error in auth middleware:", error);
      return res.status(500).json({ error: "Authentication error" });
    }
  };

  // GET all team members
  router.get("/team-members", async (req, res) => {
    try {
      let query = `SELECT * FROM team_members`;
      const queryParams = [];

      if (req.query.semester) {
        // Handle both cases: member_type filter or semester filter
        if (
          req.query.semester === "Developer" ||
          req.query.semester === "Researcher" ||
          req.query.semester === "Admin"
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

  // GET a specific team member by ID
  router.get("/team-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT * FROM team_members WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST a new team member (admin only)
  // Use multer middleware for single file upload in the route handler
  router.post("/team-members-put", isAdmin, (req, res) => {
    console.log("Received request to add team member");
    // Handle the upload separately to better handle errors
    upload.single("image")(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: err.message });
      }
  
      const client = await pool.connect();
      try {
        console.log("Request body:", req.body);
        console.log("File:", req.file);
        
        await client.query("BEGIN");
  
        // Extract team member data from request body
        const { 
          name, 
          role, 
          github_link, 
          linkedin_link, 
          semester, 
          member_type, 
          founder 
        } = req.body;
  
        // Validate required fields
        if (!name || !role || !semester || !member_type) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Missing required fields" });
        }
  
        // Convert founder to boolean
        const isFounder = founder === "true" || founder === true;
  
        // Get the current maximum ID
        const maxIdResult = await client.query('SELECT MAX(id) FROM team_members');
        const nextId = (maxIdResult.rows[0].max || 0) + 1;
        
        console.log(`Using next ID: ${nextId}`);
  
        // Insert team member data with explicit ID
        console.log("Inserting team member data");
        const memberResult = await client.query(
          `INSERT INTO team_members 
           (id, name, role, github_url, linkedin_url, semester, member_type, founder) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           RETURNING id`,
          [nextId, name, role, github_link, linkedin_link, semester, member_type, isFounder]
        );
        console.log("Team member inserted");
        const memberId = memberResult.rows[0].id;
  
        // Handle image upload if provided
        if (req.file) {
          console.log("Inserting image data");
          await client.query(
            `INSERT INTO team_member_images 
             (team_member_id, image_data, mime_type) 
             VALUES ($1, $2, $3)`,
            [memberId, req.file.buffer, req.file.mimetype]
          );
          console.log("Image inserted");
        }
  
        await client.query("COMMIT");
        
        res.status(201).json({
          id: memberId,
          message: "Team member added successfully"
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error adding team member:", error);
        res.status(500).json({ error: error.message });
      } finally {
        client.release();
      }
    });
  });

  // PUT/UPDATE a team member (admin only)
  router.put("/team-members/:id", isAdmin, (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: err.message });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const { id } = req.params;
        const { 
          name, 
          role, 
          github_link, 
          linkedin_link, 
          semester, 
          member_type, 
          founder 
        } = req.body;

        // Validate required fields
        if (!name || !role || !semester || !member_type) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert founder to boolean
        const isFounder = founder === "true" || founder === true;

        // Update team member data - FIXED: github_url and linkedin_url field names to match DB schema
        const updateResult = await client.query(
          `UPDATE team_members 
           SET name = $1, role = $2, github_url = $3, linkedin_url = $4, 
               semester = $5, member_type = $6, founder = $7 
           WHERE id = $8 
           RETURNING *`,
          [name, role, github_link, linkedin_link, semester, member_type, isFounder, id]
        );

        if (updateResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Team member not found" });
        }

        // Update image if provided
        if (req.file) {
          // Check if image record exists
          const imageCheck = await client.query(
            "SELECT * FROM team_member_images WHERE team_member_id = $1",
            [id]
          );

          if (imageCheck.rows.length > 0) {
            // Update existing image
            await client.query(
              `UPDATE team_member_images 
               SET image_data = $1, mime_type = $2 
               WHERE team_member_id = $3`,
              [req.file.buffer, req.file.mimetype, id]
            );
          } else {
            // Insert new image
            await client.query(
              `INSERT INTO team_member_images 
               (team_member_id, image_data, mime_type) 
               VALUES ($1, $2, $3)`,
              [id, req.file.buffer, req.file.mimetype]
            );
          }
        }

        await client.query("COMMIT");
        
        res.json({
          ...updateResult.rows[0],
          message: "Team member updated successfully"
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating team member:", error);
        res.status(500).json({ error: error.message });
      } finally {
        client.release();
      }
    });
  });

  // DELETE a team member (admin only)
  router.delete("/team-members/:id", isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { id } = req.params;

      // First delete the associated image (if any)
      await client.query(
        "DELETE FROM team_member_images WHERE team_member_id = $1",
        [id]
      );

      // Then delete the team member
      const result = await client.query(
        "DELETE FROM team_members WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Team member not found" });
      }

      await client.query("COMMIT");
      
      res.json({
        message: "Team member deleted successfully",
        deletedMember: result.rows[0]
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  });

  return router;
}

export default AboutAPI;  