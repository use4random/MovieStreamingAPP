const memoryStore = new Map();

function pruneExpiredRecords(now) {
    if (memoryStore.size > 200) {
        for (const [key, record] of memoryStore.entries()) {
            if (now > record.resetTime) {
                memoryStore.delete(key);
            }
        }
    }
}



/**
 * Creates an in-memory sliding-window rate limiter for Express routes.
 *
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Time window in milliseconds (default: 60000 - 1 minute)
 * @param {number} options.max Maximum requests per window (default: 120)
 * @param {Object} options.message Error payload returned when limit exceeded
 */
export function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 60000;
    const maxRequests = options.max || 120;
    const message = options.message || { error: 'Too many requests, please slow down.' };

    return (req, res, next) => {
        // Security: Use req.ip which respects Express 'trust proxy' setting, not raw spoofable headers
        const ip = req.ip || 'unknown';
        const key = `${options.name || 'global'}:${ip}`;
        const now = Date.now();

        pruneExpiredRecords(now);

        let record = memoryStore.get(key);
        if (!record || now > record.resetTime) {
            record = { count: 1, resetTime: now + windowMs };
            memoryStore.set(key, record);
            return next();
        }

        record.count++;
        if (record.count > maxRequests) {
            res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
            return res.status(429).json(message);
        }

        next();
    };
}

/**
 * Strict Rate Limiter for Authentication Endpoints (register / login)
 * Protects against brute-force attacks and credential stuffing.
 */
export const authLimiter = createRateLimiter({
    name: 'api_auth',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Max 15 attempts per 15 minutes
    message: { error: 'Too many authentication attempts. Please wait 15 minutes before trying again.' }
});

