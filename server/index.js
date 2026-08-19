import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import tmdbRoutes from './routes/tmdb.js';
import collectionsRoutes from './routes/collections.js';
import serverRoutes from './routes/servers.js';
import proxyRoutes from './routes/proxy.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api', tmdbRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'MultiMovies Quantum API Gateway',
        version: '2.0.0',
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
                res.status(200).send('MultiMovies API Gateway is Active. Run Vite client on port 5173 for development.');
            }
        });
    }
});

// Start Server (Listen only when running directly outside Vercel Serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 MULTIMOVIES CYBER BACKEND RUNNING ON PORT ${PORT}`);
        console.log(`📡 TMDB API Gateway: http://localhost:${PORT}/api/health`);
        console.log(`=================================================\n`);
    });
}

export default app;

