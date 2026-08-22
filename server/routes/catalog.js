/**
 * CinePulse Catalog API Routes
 * ==============================
 * Serves pre-synced content from the local SQLite media_catalog table.
 * These routes are lightning-fast (no TMDB API call needed) because
 * the data is already stored locally from the auto-sync engine.
 *
 * Routes:
 *   GET /api/catalog                  - Browse catalog with filters
 *   GET /api/catalog/stats            - Total count, category breakdown
 *   GET /api/catalog/categories       - List all synced categories
 *   GET /api/catalog/search?q=        - Full-text search across catalog
 *   POST /api/catalog/sync/trigger    - (Admin) Trigger a manual sync
 */

import express from 'express';
import db from '../data/db.js';
import { runFullSync } from '../sync/contentSync.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// ── Prepared Statements ───────────────────────────────────────────────────────
const getByCategory = db.prepare(`
    SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path,
           vote_average, vote_count, release_date, popularity, original_language,
           genre_ids, overview, category
    FROM media_catalog
    WHERE category = ?
    ORDER BY popularity DESC
    LIMIT ? OFFSET ?
`);

const countByCategory = db.prepare(`
    SELECT COUNT(*) as total FROM media_catalog WHERE category = ?
`);

const getByMediaType = db.prepare(`
    SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path,
           vote_average, popularity, release_date, original_language, genre_ids, overview
    FROM media_catalog
    WHERE media_type = ?
    ORDER BY popularity DESC
    LIMIT ? OFFSET ?
`);

const searchCatalog = db.prepare(`
    SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path,
           vote_average, popularity, release_date, overview
    FROM media_catalog
    WHERE title LIKE ? OR overview LIKE ?
    ORDER BY popularity DESC
    LIMIT 40
`);

const getCatalogStats = db.prepare(`
    SELECT
        COUNT(*) as total,
        SUM(CASE WHEN media_type = 'movie' THEN 1 ELSE 0 END) as movies,
        SUM(CASE WHEN media_type = 'tv'    THEN 1 ELSE 0 END) as tv_shows,
        MAX(synced_at) as last_synced
    FROM media_catalog
`);

const getCategoryBreakdown = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM media_catalog
    GROUP BY category
    ORDER BY count DESC
`);

const getByLanguage = db.prepare(`
    SELECT tmdb_id as id, media_type, title, poster_path, vote_average, popularity, release_date
    FROM media_catalog
    WHERE original_language = ?
    ORDER BY popularity DESC
    LIMIT ? OFFSET ?
`);

// ── Helper: Build paginated response ─────────────────────────────────────────
function paginate(rows, total, page, limit) {
    return {
        page,
        results: rows.map(r => ({
            ...r,
            genre_ids: (() => { try { return JSON.parse(r.genre_ids || '[]'); } catch { return []; } })()
        })),
        total_results: total,
        total_pages: Math.ceil(total / limit)
    };
}

// ── GET /api/catalog — Browse with filters ────────────────────────────────────
router.get('/', (req, res) => {
    try {
        const page    = Math.max(1, parseInt(req.query.page  || '1',  10));
        const limit   = Math.min(40, parseInt(req.query.limit || '20', 10));
        const offset  = (page - 1) * limit;
        const cat     = req.query.category || null;
        const type    = req.query.type     || null;
        const lang    = req.query.lang     || null;

        let rows, total;

        if (cat) {
            rows  = getByCategory.all(cat, limit, offset);
            total = countByCategory.get(cat)?.total || 0;
        } else if (type && ['movie', 'tv'].includes(type)) {
            rows  = getByMediaType.all(type, limit, offset);
            total = db.prepare(`SELECT COUNT(*) as c FROM media_catalog WHERE media_type = ?`).get(type)?.c || 0;
        } else if (lang) {
            rows  = getByLanguage.all(lang, limit, offset);
            total = db.prepare(`SELECT COUNT(*) as c FROM media_catalog WHERE original_language = ?`).get(lang)?.c || 0;
        } else {
            rows  = db.prepare(`SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path, vote_average, popularity, release_date, genre_ids, overview FROM media_catalog ORDER BY popularity DESC LIMIT ? OFFSET ?`).all(limit, offset);
            total = db.prepare(`SELECT COUNT(*) as c FROM media_catalog`).get()?.c || 0;
        }

        res.json(paginate(rows, total, page, limit));
    } catch (err) {
        console.error('[Catalog] Browse error:', err.message);
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
});

// ── GET /api/catalog/search?q= ────────────────────────────────────────────────
router.get('/search', (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) return res.json({ results: [] });

        const pattern = `%${q}%`;
        const rows = searchCatalog.all(pattern, pattern);
        res.json({
            results: rows.map(r => ({ ...r, genre_ids: [] })),
            total_results: rows.length
        });
    } catch (err) {
        console.error('[Catalog] Search error:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// ── GET /api/catalog/stats ────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
    try {
        const stats      = getCatalogStats.get();
        const categories = getCategoryBreakdown.all();
        res.json({ ...stats, categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch catalog stats' });
    }
});

// ── GET /api/catalog/categories ───────────────────────────────────────────────
router.get('/categories', (req, res) => {
    try {
        const cats = getCategoryBreakdown.all();
        res.json({ categories: cats });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ── POST /api/catalog/sync/trigger — Manual admin-only sync trigger ────────────
let syncRunning = false;

router.post('/sync/trigger', requireAuth, async (req, res) => {
    // Only allow admin role users
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    if (syncRunning) {
        return res.status(409).json({ error: 'Sync already in progress. Please wait.' });
    }

    res.json({ message: 'Sync started in background. Check /api/catalog/stats for progress.' });

    syncRunning = true;
    runFullSync()
        .catch(err => console.error('[Catalog] Manual sync error:', err.message))
        .finally(() => { syncRunning = false; });
});

// ── GET /api/catalog/sync/status ─────────────────────────────────────────────
router.get('/sync/status', (req, res) => {
    const stats = getCatalogStats.get();
    res.json({
        running: syncRunning,
        total_items: stats?.total || 0,
        last_synced: stats?.last_synced || null,
    });
});

export default router;
