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
import { startAutoSync } from './sync/contentSync.js';

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

// Security: Environment-based CORS origin filtering
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : null;

app.use(cors({
    origin: function (origin, callback) {
        // Allow same-origin / server-to-server / curl requests with no origin header
        if (!origin) return callback(null, true);
        // In development without ALLOWED_ORIGINS set, allow all
        if (!allowedOrigins) {
            if (process.env.NODE_ENV === 'production') {
                return callback(new Error('CORS policy violation: ALLOWED_ORIGINS is not configured for production.'));
            }
            return callback(null, true);
        }
        if (allowedOrigins.includes('*')) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy violation: Origin not allowed.'));
    },
    credentials: true,
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

// Serve React static build assets from client/dist
const clientDist = path.join(process.cwd(), 'client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        const indexPath = path.join(clientDist, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        } else {
            return res.status(200).send('CinePulse Cyber API Gateway is Active.');
        }
    }
});



// Start Server (Listen only when running directly outside Vercel Serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 CINEPULSE CYBER BACKEND RUNNING ON PORT ${PORT}`);
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

