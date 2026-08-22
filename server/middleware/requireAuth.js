import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET environment variable is not set.');
    process.exit(1);
}

/**
 * Strict authentication middleware.
 * Derives req.userId server-side from a verified JWT token.
 * Rejects unauthenticated requests with HTTP 401.
 */
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = req.cookies?.session || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (!token) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.sub) {
            return res.status(401).json({ error: 'Invalid authentication session' });
        }
        req.userId = decoded.sub; // Trusted, server-derived ID
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
}

/**
 * Optional authentication middleware.
 * Attaches req.userId if a valid token is provided.
 * Allows anonymous guest access (req.userId = 'guest' or guest header) without blocking.
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = req.cookies?.session || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (!token) {
        req.userId = req.query.guestId || req.headers['x-guest-id'] || 'guest';
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.sub;
        req.user = decoded;
    } catch {
        req.userId = req.query.guestId || req.headers['x-guest-id'] || 'guest';
    }

    next();
}
