import express from "express";
import multer from "multer";

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
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

// Create API routes for the About page
function AboutAPI(pool) {
  const router = express.Router();

  // Middleware to check if user is authenticated and is admin
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!req.user.is_admin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    next();
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
  router.post("/team-members", isAdmin, upload.single("image"), async (req, res) => {
    const client = await pool.connect();
    try {
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

      // Convert founder to boolean
      const isFounder = founder === "true" || founder === true;

      // Insert team member data
      const memberResult = await client.query(
        `INSERT INTO team_members 
         (name, role, github_link, linkedin_link, semester, member_type, founder) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [name, role, github_link, linkedin_link, semester, member_type, isFounder]
      );

      const memberId = memberResult.rows[0].id;

      // Handle image upload if provided
      if (req.file) {
        await client.query(
          `INSERT INTO team_member_images 
           (team_member_id, image_data, mime_type) 
           VALUES ($1, $2, $3)`,
          [memberId, req.file.buffer, req.file.mimetype]
        );
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

  // PUT/UPDATE a team member (admin only)
  router.put("/team-members/:id", isAdmin, upload.single("image"), async (req, res) => {
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

      // Convert founder to boolean
      const isFounder = founder === "true" || founder === true;

      // Update team member data
      const updateResult = await client.query(
        `UPDATE team_members 
         SET name = $1, role = $2, github_link = $3, linkedin_link = $4, 
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