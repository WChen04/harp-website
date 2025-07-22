import express from "express";
import multer from "multer";
import { uploadFile, deleteFile, generateBlobUrl } from "./azureStorage.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

function AboutAPI(pool) {
  const router = express.Router();

  const isAdmin = (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      if (!req.user.is_admin) return res.status(403).json({ error: "Not authorized" });
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Authentication error" });
    }
  };

  router.get("/team-members", async (req, res) => {
    try {
      let query = `SELECT * FROM team_members`;
      const queryParams = [];

      if (req.query.semester) {
        if (["Developer", "Researcher", "Admin"].includes(req.query.semester)) {
          query += ` WHERE member_type = $1`;
          queryParams.push(req.query.semester);
        } else if (["Fall 2024", "Spring 2025"].includes(req.query.semester)) {
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

  // GET a specific team member by ID (including image URL)
  router.get("/team-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT *, blob_name, mime_type FROM team_members WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Team member not found" });
      }

      const member = result.rows[0];
      const imageUrl = member.blob_name
        ? generateBlobUrl(member.blob_name, "aboutimages")
        : null;

      res.json({ ...member, imageUrl });
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ error: error.message });
    }
  });


  router.get("/team-member-image/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT blob_name, mime_type FROM team_members WHERE id = $1", [id]);
      if (result.rows.length === 0 || !result.rows[0].blob_name) return res.status(404).json({ error: "Image not found" });
      const imageUrl = generateBlobUrl(result.rows[0].blob_name, "aboutimages");
      res.json({ imageUrl });
    } catch (err) {
      console.error("Error fetching image:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.post("/team-members-put", isAdmin, (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      const client = await pool.connect();
      try {
        const { name, role, github_link, linkedin_link, semester, member_type, founder } = req.body;
        if (!name || !role || !semester || !member_type) return res.status(400).json({ error: "Missing required fields" });
        const isFounder = founder === "true" || founder === true;
        const maxIdResult = await client.query('SELECT MAX(id) FROM team_members');
        const nextId = (maxIdResult.rows[0].max || 0) + 1;
        await client.query("BEGIN");
        await client.query(`INSERT INTO team_members (id, name, role, github_url, linkedin_url, semester, member_type, founder) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [nextId, name, role, github_link, linkedin_link, semester, member_type, isFounder]);

        if (req.file) {
          const { blobName } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "aboutimages");
          await client.query(`UPDATE team_members SET blob_name = $1, mime_type = $2 WHERE id = $3`, [blobName, req.file.mimetype, nextId]);
        }

        await client.query("COMMIT");
        res.status(201).json({ id: nextId, message: "Team member added successfully" });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error adding team member:", error);
        res.status(500).json({ error: error.message });
      } finally {
        client.release();
      }
    });
  });

  router.put("/team-members/:id", isAdmin, (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      const client = await pool.connect();
      try {
        const { id } = req.params;
        const { name, role, github_link, linkedin_link, semester, member_type, founder } = req.body;
        if (!name || !role || !semester || !member_type) return res.status(400).json({ error: "Missing required fields" });
        const isFounder = founder === "true" || founder === true;

        await client.query("BEGIN");

        await client.query(`UPDATE team_members SET name=$1, role=$2, github_url=$3, linkedin_url=$4, semester=$5, member_type=$6, founder=$7 WHERE id=$8`, [name, role, github_link, linkedin_link, semester, member_type, isFounder, id]);

        if (req.file) {
          const { blobName } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "aboutimages");
          await client.query(`UPDATE team_members SET blob_name = $1, mime_type = $2 WHERE id = $3`, [blobName, req.file.mimetype, id]);
        }

        await client.query("COMMIT");
        res.json({ message: "Team member updated successfully" });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating team member:", error);
        res.status(500).json({ error: error.message });
      } finally {
        client.release();
      }
    });
  });

  router.delete("/team-members/:id", isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { id } = req.params;
      const result = await client.query("SELECT blob_name FROM team_members WHERE id = $1", [id]);

      let blobDeleted = false;
      if (result.rows.length > 0 && result.rows[0].blob_name) {
        try {
          blobDeleted = await deleteFile(result.rows[0].blob_name, "aboutimages");
        } catch (err) {
          console.warn("Blob deletion failed:", err.message);
        }
      }

      const deleteResult = await client.query("DELETE FROM team_members WHERE id = $1 RETURNING *", [id]);
      if (deleteResult.rows.length === 0) return res.status(404).json({ error: "Team member not found" });

      await client.query("COMMIT");
      res.json({ message: "Team member deleted", deletedMember: deleteResult.rows[0], blobDeleted });
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
