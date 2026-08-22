/**
 * 🔞 Isolated Adult / Mature Content Sub-Router
 * Mounted at /api/adult
 */

import express from 'express';
import { getAdultCatalogStmt, getAdultCountStmt, wipeAdultData } from './db.js';
import { syncAdultContent } from './scraper.js';

const router = express.Router();

/**
 * GET /api/adult/feed
 * Retrieves isolated 18+ content items with pagination.
 */
router.get('/feed', (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(40, parseInt(req.query.limit || '20', 10));
        const offset = (page - 1) * limit;

        const items = getAdultCatalogStmt.all(limit, offset);
        const total = getAdultCountStmt.get().count;

        res.json({
            page,
            results: items,
            total_results: total,
            total_pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('[Adult API] Feed fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch adult catalog' });
    }
});

/**
 * POST /api/adult/sync
 * Trigger manual background sync of adult content.
 */
router.post('/sync', async (req, res) => {
    try {
        res.json({ message: '18+ Sync initiated in background' });
        syncAdultContent().catch(err => console.error('[Adult Sync Err]:', err.message));
    } catch (err) {
        res.status(500).json({ error: 'Failed to trigger sync' });
    }
});

/**
 * POST /api/adult/wipe
 * Instantly wipes all 18+ content data from database.
 */
router.post('/wipe', (req, res) => {
    try {
        wipeAdultData();
        res.json({ success: true, message: 'All 18+ data completely wiped from system.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to wipe 18+ data' });
    }
});

export default router;
