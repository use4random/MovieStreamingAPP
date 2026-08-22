import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
    createUserStmt, 
    findUserByEmailStmt, 
    findUserByUsernameStmt, 
    findUserByIdStmt 
} from '../data/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.VERCEL ? 'cinepulse-vercel-fallback-secret-key-2026' : null);
if (!JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
}
const TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function generateToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role || 'user'
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRE_SECONDS }
    );
}

function setSessionCookie(res, token) {
    res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_EXPIRE_SECONDS * 1000
    });
}

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body || {};

        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
        }
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least one number.' });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Check duplicates
        const existingEmail = findUserByEmailStmt.get(cleanEmail);
        if (existingEmail) {
            return res.status(409).json({ error: 'An account with this email address already exists.' });
        }

        const existingUsername = findUserByUsernameStmt.get(cleanUsername);
        if (existingUsername) {
            return res.status(409).json({ error: 'Username is already taken. Please choose another.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

        createUserStmt.run(userId, cleanUsername, cleanEmail, passwordHash, 'user');

        const newUser = { id: userId, username: cleanUsername, email: cleanEmail, role: 'user' };
        const token = generateToken(newUser);
        setSessionCookie(res, token);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: userId,
                username: cleanUsername,
                email: cleanEmail,
                role: 'user'
            }
        });
    } catch (err) {
        console.error('[Auth Error] Registration failure:', err.message);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with username/email and password
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { identifier, password } = req.body || {};

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Please provide username/email and password.' });
        }

        const cleanId = String(identifier).trim();
        let user = findUserByEmailStmt.get(cleanId) || findUserByUsernameStmt.get(cleanId);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials. Please check your details and try again.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials. Please check your details and try again.' });
        }

        const token = generateToken(user);
        setSessionCookie(res, token);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('[Auth Error] Login failure:', err.message);
        res.status(500).json({ error: 'Failed to log in. Please try again.' });
    }
});

/**
 * POST /api/auth/logout
 * Log out user and clear session cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('session');
    res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Retrieve currently logged-in user profile
 */
router.get('/me', requireAuth, (req, res) => {
    try {
        const user = findUserByIdStmt.get(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
