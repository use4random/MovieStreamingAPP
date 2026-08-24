import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
    createUserStmt, 
    findUserByEmailStmt, 
    findUserByUsernameStmt, 
    findUserByIdStmt 
} from '../data/db.js';
import { cache } from '../utils/cache.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { setCsrfCookie } from '../middleware/csrf.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cinepulse-cyber-auth-production-jwt-secret-key-2026';
const TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60; // 7 days
// Safe precomputed bcrypt dummy hash for constant-time comparison on nonexistent accounts
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

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
        path: '/',
        maxAge: TOKEN_EXPIRE_SECONDS * 1000
    });
}

function logAuthEvent(event, details = {}) {
    try {
        console.log(JSON.stringify({
            event,
            ...details,
            timestamp: new Date().toISOString()
        }));
    } catch {}
}

/**
 * POST /api/auth/register
 * Register a new user account and establish an HttpOnly cookie session
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
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Check duplicates in SQLite and distributed store
        let existingEmail = null;
        let existingUsername = null;
        try {
            existingEmail = findUserByEmailStmt.get(cleanEmail) || await cache.get(`user:email:${cleanEmail}`);
            existingUsername = findUserByUsernameStmt.get(cleanUsername) || await cache.get(`user:name:${cleanUsername.toLowerCase()}`);
        } catch (dbErr) {
            console.warn('[Auth Duplicate Check Warning]:', dbErr.message);
        }

        if (existingEmail) {
            logAuthEvent('register_duplicate_email', { email: cleanEmail, ip: req.ip || 'unknown' });
            return res.status(409).json({ error: 'An account with this email address already exists.' });
        }

        if (existingUsername) {
            logAuthEvent('register_duplicate_username', { username: cleanUsername, ip: req.ip || 'unknown' });
            return res.status(409).json({ error: 'Username is already taken. Please choose another.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

        const userRecord = {
            id: userId,
            username: cleanUsername,
            email: cleanEmail,
            password_hash: passwordHash,
            role: 'user',
            created_at: new Date().toISOString()
        };

        try {
            createUserStmt.run(userId, cleanUsername, cleanEmail, passwordHash, 'user');
        } catch (insertErr) {
            console.warn('[Auth Insert Warning]:', insertErr.message);
        }

        // Synchronize into distributed persistent cache (30 days TTL)
        try {
            await cache.set(`user:email:${cleanEmail}`, userRecord, 86400 * 30);
            await cache.set(`user:name:${cleanUsername.toLowerCase()}`, userRecord, 86400 * 30);
            await cache.set(`user:id:${userId}`, userRecord, 86400 * 30);
        } catch {}

        const newUser = { id: userId, username: cleanUsername, email: cleanEmail, role: 'user' };
        const token = generateToken(newUser);
        setSessionCookie(res, token);
        setCsrfCookie(res);

        logAuthEvent('register_success', { userId, username: cleanUsername, ip: req.ip || 'unknown' });

        return res.status(201).json({
            success: true,
            token, // Backward compatibility for cached frontend bundles
            user: {
                id: userId,
                username: cleanUsername,
                email: cleanEmail,
                role: 'user'
            }
        });
    } catch (err) {
        logAuthEvent('register_failure', { error: err.message, ip: req.ip || 'unknown' });
        return res.status(400).json({ error: err.message || 'Failed to create account. Please try again.' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate existing user and establish an HttpOnly cookie session
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { identifier, password } = req.body || {};

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Please provide username/email and password.' });
        }

        const cleanId = String(identifier).trim();
        const lowerId = cleanId.toLowerCase();
        let user = null;

        try {
            user = findUserByEmailStmt.get(cleanId) || findUserByUsernameStmt.get(cleanId);
        } catch (dbErr) {
            console.warn('[Auth Login DB Warning]:', dbErr.message);
        }

        // Check distributed cache fallback if SQLite is in separate serverless container
        if (!user) {
            try {
                user = await cache.get(`user:email:${lowerId}`) || await cache.get(`user:name:${lowerId}`);
                if (user) {
                    try {
                        createUserStmt.run(user.id, user.username, user.email, user.password_hash, user.role || 'user');
                    } catch {}
                }
            } catch {}
        }

        if (!user || !user.password_hash) {
            // Mitigate timing difference on non-existent account
            try { await bcrypt.compare(password, DUMMY_HASH); } catch {}
            logAuthEvent('login_failed_unknown_user', { identifier: cleanId, ip: req.ip || 'unknown' });
            return res.status(401).json({ error: 'Invalid credentials. Please check your details and try again.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            logAuthEvent('login_failed_bad_password', { userId: user.id, ip: req.ip || 'unknown' });
            return res.status(401).json({ error: 'Invalid credentials. Please check your details and try again.' });
        }

        const token = generateToken(user);
        setSessionCookie(res, token);
        setCsrfCookie(res);

        logAuthEvent('login_success', { userId: user.id, username: user.username, ip: req.ip || 'unknown' });

        return res.json({
            success: true,
            token, // Backward compatibility
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user'
            }
        });
    } catch (err) {
        logAuthEvent('login_failure', { error: err.message, ip: req.ip || 'unknown' });
        return res.status(400).json({ error: err.message || 'Failed to log in. Please try again.' });
    }
});

/**
 * POST /api/auth/logout
 * Log out user and clear HttpOnly session cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    logAuthEvent('logout_success', { ip: req.ip || 'unknown' });
    res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Retrieve currently logged-in user profile from verified HttpOnly cookie session
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        let user = findUserByIdStmt.get(req.userId);
        if (!user) {
            try {
                user = await cache.get(`user:id:${req.userId}`);
            } catch {}
        }

        // Fallback directly to cryptographically verified JWT payload
        const userProfile = {
            id: req.userId,
            username: user?.username || req.user?.username || 'Cyber Pilot',
            email: user?.email || req.user?.email || '',
            role: user?.role || req.user?.role || 'user',
            created_at: user?.created_at || new Date().toISOString()
        };

        return res.json({ user: userProfile });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
