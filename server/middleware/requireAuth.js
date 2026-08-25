import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cinepulse-auth-production-jwt-secret-key-2026';

/**
 * Strict authentication middleware.
 * Derives req.userId server-side exclusively from a verified HttpOnly session cookie.
 * Rejects unauthenticated requests with HTTP 401.
 */
export function requireAuth(req, res, next) {
    const token = req.cookies?.session;

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
    } catch {
        return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
}

/**
 * Optional authentication middleware.
 * Attaches req.userId if a valid session cookie is provided.
 * Falls back to 'guest' without blocking if not authenticated.
 */
export function optionalAuth(req, res, next) {
    const token = req.cookies?.session;

    if (!token) {
        req.userId = 'guest';
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.sub) {
            req.userId = decoded.sub;
            req.user = decoded;
        } else {
            req.userId = 'guest';
        }
    } catch {
        req.userId = 'guest';
    }

    next();
}
