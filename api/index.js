import app from '../server/server.js';

export default function handler(req, res) {
    // Ensure req.url includes /api prefix for Express router matching on Vercel Serverless
    if (req.url && !req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }
    return app(req, res);
}
