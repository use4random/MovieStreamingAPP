import express from 'express';
import { cache } from '../utils/cache.js';

const router = express.Router();

// Security: Sanitize userId to prevent cache pollution, path traversal, and enumeration
function sanitizeUserId(raw) {
    if (!raw || typeof raw !== 'string') return 'guest';
    const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    return clean || 'guest';
}

// Helper key generators for user store
const getWatchlistKey = (userId = 'guest') => `user:${sanitizeUserId(userId)}:watchlist`;
const getHistoryKey = (userId = 'guest') => `user:${sanitizeUserId(userId)}:history`;

/**
 * GET /api/user/watchlist?userId=guest
 * Retrieve saved watchlist items
 */
router.get('/watchlist', async (req, res) => {
    try {
        const userId = req.query.userId || 'guest';
        const watchlist = await cache.get(getWatchlistKey(userId)) || [];
        res.json({ userId, watchlist });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve watchlist' });
    }
});

/**
 * POST /api/user/watchlist
 * Add item to watchlist
 */
router.post('/watchlist', async (req, res) => {
    try {
        const { userId = 'guest', item } = req.body;
        if (!item || !item.id) {
            return res.status(400).json({ error: 'Invalid media item payload' });
        }

        const key = getWatchlistKey(userId);
        let list = await cache.get(key) || [];

        // Avoid duplicate entries
        const existingIdx = list.findIndex(i => String(i.id) === String(item.id) && i.media_type === item.media_type);
        if (existingIdx >= 0) {
            list[existingIdx] = { ...list[existingIdx], ...item, addedAt: new Date().toISOString() };
        } else {
            list.unshift({ ...item, addedAt: new Date().toISOString() });
        }

        // Store persistent list (TTL 30 days = 2592000s)
        await cache.set(key, list, 2592000);
        res.json({ success: true, watchlist: list });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save watchlist item' });
    }
});

/**
 * DELETE /api/user/watchlist
 * Remove item from watchlist
 */
router.delete('/watchlist', async (req, res) => {
    try {
        const { userId = 'guest', id, mediaType } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing item id' });

        const key = getWatchlistKey(userId);
        let list = await cache.get(key) || [];
        list = list.filter(i => !(String(i.id) === String(id) && (!mediaType || i.media_type === mediaType)));

        await cache.set(key, list, 2592000);
        res.json({ success: true, watchlist: list });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove watchlist item' });
    }
});

/**
 * GET /api/user/history?userId=guest
 * Retrieve "Continue Watching" playback history
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.query.userId || 'guest';
        const history = await cache.get(getHistoryKey(userId)) || [];
        res.json({ userId, history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve playback history' });
    }
});

/**
 * POST /api/user/history
 * Save or update playback progress (Continue Watching)
 */
router.post('/history', async (req, res) => {
    try {
        const {
            userId = 'guest',
            id,
            mediaType = 'movie',
            title,
            posterPath,
            backdropPath,
            season = 1,
            episode = 1,
            progressSeconds = 0,
            durationSeconds = 0
        } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing id' });
        }

        const key = getHistoryKey(userId);
        let history = await cache.get(key) || [];

        const record = {
            id,
            media_type: mediaType,
            title,
            poster_path: posterPath,
            backdrop_path: backdropPath,
            season: Number(season),
            episode: Number(episode),
            progressSeconds: Number(progressSeconds),
            durationSeconds: Number(durationSeconds),
            updatedAt: new Date().toISOString()
        };

        // Filter out old entry for same media item
        history = history.filter(h => !(String(h.id) === String(id) && h.media_type === mediaType));
        history.unshift(record);

        // Keep last 50 items per user
        history = history.slice(0, 50);

        await cache.set(key, history, 2592000);
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update playback history' });
    }
});

export default router;
