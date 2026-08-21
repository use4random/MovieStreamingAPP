import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import tmdbRoutes from './routes/tmdb.js';
import collectionsRoutes from './routes/collections.js';
import serverRoutes from './routes/servers.js';
import proxyRoutes from './routes/proxy.js';
import userRoutes from './routes/user.js';
import { createRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Trust first proxy hop (Vercel/Cloudflare) for accurate client IP in rate limiting
app.set('trust proxy', 1);

// Performance: Gzip compress all API responses (60-80% size reduction)
app.use(compression({ level: 6, threshold: 1024 }));

// Security: Standard response headers (X-Content-Type-Options, HSTS, Referrer-Policy, etc.)
// CSP disabled because it conflicts with proxied iframe embeds
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Security: Environment-based CORS origin filtering
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : null;

app.use(cors({
    origin: function (origin, callback) {
        // Allow same-origin / server-to-server / curl requests with no origin header
        if (!origin) return callback(null, true);
        if (!allowedOrigins || allowedOrigins.includes('*')) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy violation: Origin not allowed.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Security: Limit JSON body size to prevent memory exhaustion DoS
app.use(express.json({ limit: '100kb' }));

// Rate Limiting: Apply sliding window rate limiters to protect against DoS
const globalApiLimiter = createRateLimiter({ name: 'api_global', windowMs: 60000, max: 150 });
const strictProxyLimiter = createRateLimiter({ name: 'api_proxy', windowMs: 60000, max: 40, message: { error: 'Rate limit exceeded for streaming proxy. Please wait a minute.' } });

app.use('/api', globalApiLimiter);
app.use('/api/proxy', strictProxyLimiter);

// Edge CDN Caching: Attach stale-while-revalidate headers for API catalog GET requests
app.use('/api', (req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/proxy') && !req.path.startsWith('/user')) {
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');
    }
    next();
});

// API Routes
app.use('/api', tmdbRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/user', userRoutes);

// Web Vitals collection endpoint
app.post('/api/vitals', (req, res) => {
    const { name, value, rating, id } = req.body || {};
    if (name) {
        console.log(`[web-vitals] ${name}: ${Math.round(value ?? 0)}ms (${rating ?? 'unknown'}) id=${id ?? '-'}`);
    }
    res.json({ ok: true });
});

// Health check endpoint (stripped version info in production)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        timestamp: new Date().toISOString()
    });
});

// Production: Serve React static build if present
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
    // If request does not start with /api, send index.html
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(clientDist, 'index.html'), (err) => {
            if (err) {
                res.status(200).send('CinePulse API Gateway is Active. Run Vite client on port 5173 for development.');
            }
        });
    }
});

// Start Server (Listen only when running directly outside Vercel Serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 CINEPULSE CYBER BACKEND RUNNING ON PORT ${PORT}`);
        console.log(`📡 TMDB API Gateway: http://localhost:${PORT}/api/health`);
        console.log(`=================================================\n`);
    });
}

export default app;

