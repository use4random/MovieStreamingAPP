import express from 'express';
import { 
    getWatchlistByUserIdStmt, 
    upsertWatchlistItemStmt, 
    deleteWatchlistItemStmt,
    getHistoryByUserIdStmt,
    upsertHistoryItemStmt
} from '../data/db.js';
import { optionalAuth } from '../middleware/requireAuth.js';
import { recordCoWatch } from '../utils/cowatch.js';

const router = express.Router();

// Apply optionalAuth to all user routes to derive req.userId from verified JWT session server-side
router.use(optionalAuth);

/**
 * GET /api/user/watchlist
 * Retrieve saved watchlist items for the authenticated user (or guest)
 */
router.get('/watchlist', async (req, res) => {
    try {
        const userId = req.userId; // Server-derived, trusted ID
        const rows = getWatchlistByUserIdStmt.all(userId);
        const watchlist = rows.map(r => {
            try { return JSON.parse(r.item_json); } catch { return null; }
        }).filter(Boolean);

        res.json({ watchlist });
    } catch (err) {
        console.error('[User API] Watchlist fetch error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve watchlist' });
    }
});

/**
 * POST /api/user/watchlist
 * Save item to watchlist for the server-derived req.userId
 */
router.post('/watchlist', async (req, res) => {
    try {
        const userId = req.userId; // Server-derived, trusted ID
        const { item } = req.body || {};
        
        if (!item || !item.id) {
            return res.status(400).json({ error: 'Invalid media item payload' });
        }

        const mediaId = String(item.id);
        const mediaType = item.media_type || 'movie';
        const itemJson = JSON.stringify({ ...item, addedAt: new Date().toISOString() });

        upsertWatchlistItemStmt.run(userId, mediaId, mediaType, itemJson);

        const rows = getWatchlistByUserIdStmt.all(userId);
        const watchlist = rows.map(r => {
            try { return JSON.parse(r.item_json); } catch { return null; }
        }).filter(Boolean);

        res.json({ success: true, watchlist });
    } catch (err) {
        console.error('[User API] Watchlist save error:', err.message);
        res.status(500).json({ error: 'Failed to save watchlist item' });
    }
});

/**
 * DELETE /api/user/watchlist
 * Remove item from watchlist for the server-derived req.userId
 */
router.delete('/watchlist', async (req, res) => {
    try {
        const userId = req.userId; // Server-derived, trusted ID
        const { id, mediaType } = req.body || {};

        if (!id) {
            return res.status(400).json({ error: 'Missing item id' });
        }

        deleteWatchlistItemStmt.run(userId, String(id), mediaType || 'movie');

        const rows = getWatchlistByUserIdStmt.all(userId);
        const watchlist = rows.map(r => {
            try { return JSON.parse(r.item_json); } catch { return null; }
        }).filter(Boolean);

        res.json({ success: true, watchlist });
    } catch (err) {
        console.error('[User API] Watchlist delete error:', err.message);
        res.status(500).json({ error: 'Failed to remove watchlist item' });
    }
});

/**
 * GET /api/user/history
 * Retrieve playback history ("Continue Watching") for the server-derived req.userId
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.userId; // Server-derived, trusted ID
        const history = getHistoryByUserIdStmt.all(userId);
        res.json({ history });
    } catch (err) {
        console.error('[User API] History fetch error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve playback history' });
    }
});

/**
 * POST /api/user/history
 * Save or update playback progress for the server-derived req.userId
 */
router.post('/history', async (req, res) => {
    try {
        const userId = req.userId; // Server-derived, trusted ID
        const {
            id,
            mediaType = 'movie',
            title = '',
            posterPath = '',
            backdropPath = '',
            season = 1,
            episode = 1,
            progressSeconds = 0,
            durationSeconds = 0
        } = req.body || {};

        if (!id) {
            return res.status(400).json({ error: 'Missing media id' });
        }

        upsertHistoryItemStmt.run(
            userId,
            String(id),
            mediaType,
            title,
            posterPath,
            backdropPath,
            Number(season),
            Number(episode),
            Number(progressSeconds),
            Number(durationSeconds)
        );

        // Asynchronously update co-watch collaborative matrix
        recordCoWatch(userId, id, mediaType).catch(e => console.warn('[CoWatch async err]:', e.message));

        const history = getHistoryByUserIdStmt.all(userId);
        res.json({ success: true, history });
    } catch (err) {
        console.error('[User API] History update error:', err.message);
        res.status(500).json({ error: 'Failed to update playback history' });
    }
});

export default router;
