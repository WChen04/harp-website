// LoginAPI.js
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();

export default (pool) => {
    // Enhanced register endpoint
    router.post('/register', async (req, res) => {
        const { email, password, fullName } = req.body;
    
        console.log('Registration attempt:', {
            email,
            fullName,
            passwordLength: password?.length
        });

        try {
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            console.log('Attempting database insertion...');
            const newUser = await pool.query(
                'INSERT INTO "Login" (email, password, full_name) VALUES ($1, $2, $3) RETURNING email, full_name, created_at',
                [email, hashedPassword, fullName]
            );
            console.log('Database insertion successful:', newUser.rows[0]);

            res.status(201).json({
                message: 'User registered successfully',
                user: newUser.rows[0]
            });
        } catch (error) {
            console.error('Detailed registration error:', {
                code: error.code,
                message: error.message,
                detail: error.detail,
                stack: error.stack
            });
            
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Email already registered' });
            }
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message // This will help with debugging
            });
        }
    });

    router.post('/social-register/:provider', async (req, res) => {
        const { provider } = req.params;
        const { email, fullName } = req.body; // These would come from the social provider

        try {
            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT * FROM "Login" WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length > 0) {
                // If user exists, treat it as a login
                return res.json({
                    message: 'User already registered, logged in successfully',
                    user: {
                        email: existingUser.rows[0].email,
                        full_name: existingUser.rows[0].full_name,
                        created_at: existingUser.rows[0].created_at
                    }
                });
            }

            // Generate a random secure password for social users
            // They can reset it later if they want to use password login
            const randomPassword = Math.random().toString(36).slice(-12);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            // Insert new social user
            const newUser = await pool.query(
                'INSERT INTO "Login" (email, password, full_name) VALUES ($1, $2, $3) RETURNING email, full_name, created_at',
                [email, hashedPassword, fullName]
            );

            res.status(201).json({
                message: 'Social registration successful',
                user: newUser.rows[0]
            });
        } catch (error) {
            console.error(`${provider} registration error:`, error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Login user
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        
        console.log('Login attempt for email:', email);
        console.log('Session info:', req.session);
        console.log('Is Passport initialized:', !!req.passport);
        
        try {
            const result = await pool.query(
                'SELECT * FROM "Login" WHERE email = $1',
                [email]
            );
            
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
    
            const user = result.rows[0];
            
            // Check if user has a password (might be a social login user)
            if (!user.password) {
                console.log('User has no password set:', email);
                return res.status(401).json({ 
                    error: 'Please use social login or reset your password'
                });
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
    
            await pool.query(
                'UPDATE "Login" SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
                [email]
            );
    
            // Create Passport session - THIS IS THE KEY ADDITION
            req.login(user, (err) => {
                if (err) {
                    console.error('Session creation error:', err);
                    return res.status(500).json({ error: 'Failed to create session' });
                }
                
                const { password: _, ...userData } = user;
                return res.json({
                    message: 'Login successful',
                    user: userData
                });
            });
        } catch (error) {
            console.error('Detailed login error:', {
                code: error.code,
                message: error.message,
                detail: error.detail,
                stack: error.stack
            });
            res.status(500).json({ 
                error: 'Internal server error', 
                details: error.message 
            });
        }
    });

    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        console.log('Received forgot password request for email:', email);

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        try {
            // Check if user exists
            console.log('Querying database for user...');
            const userResult = await pool.query(
                'SELECT * FROM "Login" WHERE email = $1',
                [email]
            );
            console.log('User query completed. Rows found:', userResult.rows.length);

            if (userResult.rows.length === 0) {
                console.log('No user found with email:', email);
                return res.status(404).json({ error: 'No account found with this email' });
            }

            // Generate reset token
            console.log('Generating reset token...');
            const resetToken = crypto.randomBytes(32).toString('hex');

            // Set expiry to exactly 1 hour from now using PostgreSQL's timestamp
            console.log('Updating user with reset token...');
            const result = await pool.query(
                `UPDATE "Login" 
                 SET reset_token = $1, 
                     reset_token_expiry = CURRENT_TIMESTAMP + INTERVAL '1 hour'
                 WHERE email = $2 
                 RETURNING reset_token_expiry`,
                [resetToken, email]
            );
            console.log('Update completed. Rows affected:', result.rowCount);

            const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

            res.json({
                message: 'Password reset link generated successfully',
                resetLink: resetLink
            });

        } catch (error) {
            console.error('Detailed error in forgot-password:', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                detail: error.detail
            });
            res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    });

    // Reset password with token
    router.post('/reset-password/:token', async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        try {
            // Find user with valid reset token using PostgreSQL's CURRENT_TIMESTAMP
            const user = await pool.query(
                `SELECT * FROM "Login" 
                 WHERE reset_token = $1 
                 AND reset_token_expiry > CURRENT_TIMESTAMP`,
                [token]
            );

            if (user.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid or expired reset token'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update password and clear reset token
            await pool.query(
                `UPDATE "Login" 
                 SET password = $1, 
                     reset_token = NULL, 
                     reset_token_expiry = NULL 
                 WHERE reset_token = $2`,
                [hashedPassword, token]
            );

            res.json({ message: 'Password has been reset successfully' });

        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Social login endpoint
    router.post('/social-login/:provider', async (req, res) => {
        const { provider } = req.params;
        res.status(501).json({ message: `${provider} login not implemented yet` });
    });
    router.get('/check-db', async (req, res) => {
        try {
            // Check if table exists
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'Login'
                );
            `);
            
            if (!tableCheck.rows[0].exists) {
                return res.status(404).json({ error: 'Login table does not exist' });
            }
    
            // Get table structure
            const columns = await pool.query(`
                SELECT column_name, data_type, column_default, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'Login';
            `);
    
            res.json({
                tableExists: true,
                structure: columns.rows
            });
        } catch (error) {
            res.status(500).json({
                error: 'Database check failed',
                details: error.message
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