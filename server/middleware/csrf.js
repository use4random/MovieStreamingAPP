import crypto from 'crypto';

/**
 * Double-Submit Cookie CSRF Protection Middleware
 *
 * Sets a readable 'csrf_token' cookie on GET/read requests.
 * Validates 'X-CSRF-Token' request header against the 'csrf_token' cookie
 * on mutating state-changing methods (POST, PUT, PATCH, DELETE).
 */

const CSRF_EXEMPT_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/vitals'
];

export function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res, token = null) {
    const csrfToken = token || generateCsrfToken();
    res.cookie('csrf_token', csrfToken, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    return csrfToken;
}

export function csrfProtection(req, res, next) {
    const isGetOrSafe = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);

    // Ensure a CSRF token cookie exists on GET/read requests
    if (isGetOrSafe) {
        if (!req.cookies?.csrf_token) {
            setCsrfCookie(res);
        }
        return next();
    }

    // Check if route is exempt (e.g., initial auth establishment)
    const reqPath = req.originalUrl || req.url || '';
    const isExempt = CSRF_EXEMPT_ROUTES.some(route => reqPath.startsWith(route));
    if (isExempt) {
        return next();
    }

    const cookieToken = req.cookies?.csrf_token;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`[Security Alert]: CSRF token mismatch or missing for ${req.method} ${reqPath} [IP: ${req.ip || 'unknown'}]`);
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }

    next();
}
