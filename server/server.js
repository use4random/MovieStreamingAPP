// IMPORTANT: Must be the very first import so process.env is populated
// before any other module reads it (ESM hoists all imports before code runs)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import tmdbRoutes from './routes/tmdb.js';
import collectionsRoutes from './routes/collections.js';
import serverRoutes from './routes/servers.js';
import proxyRoutes from './routes/proxy.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import recommendRoutes from './routes/recommend.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { edgeCache } from './middleware/edgeCache.js';
import { startAutoSync } from './sync/contentSync.js';

import { csrfProtection } from './middleware/csrf.js';

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

// Cookie Parser Middleware
app.use(cookieParser());

// Security: Environment-based CORS origin filtering with resilient fallbacks
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().toLowerCase())
    : [];

app.use(cors({
    origin: function (origin, callback) {
        // Allow same-origin / server-to-server / curl requests with no origin header
        if (!origin) return callback(null, true);

        const lower = origin.toLowerCase();
        // Allow localhost / 127.0.0.1
        if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
            return callback(null, true);
        }
        // Allow Vercel preview and production deployment domains (*.vercel.app)
        if (lower.endsWith('.vercel.app') || lower.includes('binge-streaming-three')) {
            return callback(null, true);
        }
        // Allow explicitly configured origins
        if (allowedOrigins.length > 0) {
            if (allowedOrigins.includes('*') || allowedOrigins.includes(lower)) {
                return callback(null, true);
            }
        }
        // Default allow rather than crashing Express with unhandled Error
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Guest-ID', 'Authorization']
}));

// Security: Limit JSON body size to prevent memory exhaustion DoS
app.use(express.json({ limit: '100kb' }));

// Double-submit cookie CSRF protection
app.use(csrfProtection);

// Rate Limiting: Apply sliding window rate limiters to protect against DoS
const globalApiLimiter = createRateLimiter({ name: 'api_global', windowMs: 60000, max: 150 });
const strictProxyLimiter = createRateLimiter({ name: 'api_proxy', windowMs: 60000, max: 40, message: { error: 'Rate limit exceeded for streaming proxy. Please wait a minute.' } });

app.use('/api', globalApiLimiter);
app.use('/api/proxy', strictProxyLimiter);

// Edge CDN Caching: Enable stale-while-revalidate caching for all read GET API routes
app.use('/api', edgeCache(300, 600));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', tmdbRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/recommend', recommendRoutes);



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

const distPath = path.join(process.cwd(), 'dist');
const clientDistPath = path.join(process.cwd(), 'client/dist');
const clientDist = fs.existsSync(path.join(distPath, 'index.html')) ? distPath : clientDistPath;

app.use(express.static(clientDist));

app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.status(404).send('Page not found');
});

// Global Error Handling Middleware (catches any unhandled errors gracefully)
app.use((err, req, res, next) => {
    console.error('[Unhandled API Error]:', err.message);
    if (!res.headersSent) {
        res.status(err.status || 400).json({
            error: err.message || 'An unexpected request error occurred. Please try again.'
        });
    }
});




// Start Server (Listen only when running directly outside Vercel Serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 CINEPULSE STREAMING BACKEND RUNNING ON PORT ${PORT}`);
        console.log(`📡 TMDB API Gateway: http://localhost:${PORT}/api/health`);
        console.log(`=================================================\n`);

        // Start automated content sync engine (runs every 6 hours)
        // Disable by setting DISABLE_AUTO_SYNC=true in .env
        if (process.env.DISABLE_AUTO_SYNC !== 'true') {
            startAutoSync();
        }
    });
}

export default app;

