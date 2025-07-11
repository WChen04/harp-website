// adminRoutes.js
import express from 'express';

// Create an admin router function that takes the database pool
const adminRoutes = (pool) => {
  const router = express.Router();

  // Middleware to check if user is authenticated and is an admin
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  };

  // Get all users with admin status
  router.get('/admin/users', isAdmin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT email, full_name, is_admin, profile_picture FROM "Login" ORDER BY full_name'
      );
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
  });

  // Toggle admin status for a user
  router.put('/admin/users/:email/toggle-admin', isAdmin, async (req, res) => {
    try {
      const { email } = req.params;
      
      // Don't allow changing own admin status
      if (email === req.user.email) {
        return res.status(400).json({ error: 'Cannot change your own admin status' });
      }
      
      // Get current admin status
      const currentStatus = await pool.query(
        'SELECT is_admin FROM "Login" WHERE email = $1',
        [email]
      );
      
      if (currentStatus.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Toggle admin status
      const newStatus = !currentStatus.rows[0].is_admin;
      
      await pool.query(
        'UPDATE "Login" SET is_admin = $1 WHERE email = $2',
        [newStatus, email]
      );
      
      res.json({
        email,
        is_admin: newStatus,
        message: `Admin status ${newStatus ? 'granted to' : 'removed from'} user`
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      res.status(500).json({ error: 'Failed to update admin status', details: error.message });
    }
  });

  return router;
};

export default adminRoutes;