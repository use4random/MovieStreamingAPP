/**
 * CinePulse Automated Content Sync Engine
 * =========================================
 * Runs periodically (every 6 hours) to pre-fetch and cache
 * thousands of movies + TV shows from TMDB into the local SQLite database.
 *
 * This is exactly how sites like MultiMovies auto-populate their content catalog.
 *
 * CATEGORIES SYNCED (24 feeds):
 *  - Trending (daily + weekly)
 *  - Popular Movies & TV
 *  - Top Rated Movies & TV
 *  - Now Playing / Upcoming Movies
 *  - Anime, K-Drama, Bollywood, Hollywood
 *  - Netflix / Prime / Disney / HBO / Hulu originals
 *  - Genre feeds: Action, Comedy, Horror, Sci-Fi, Documentary
 *
 * USAGE:
 *  - Auto-starts with the Express server (imported in server/index.js)
 *  - OR run manually: node server/sync/contentSync.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_KEY = process.env.TMDB_KEY;
const TMDB_BASE = process.env.TMDB_BASE || 'https://api.themoviedb.org/3';

// ── Config ──────────────────────────────────────────────────────────────────
const SYNC_PAGES_PER_CATEGORY = parseInt(process.env.SYNC_PAGES || '10', 10); // 10 pages = 200 items per category
const SYNC_DELAY_MS = 260;                   // ms pause between TMDB API calls (stay under 50 req/sec limit)
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // Auto-sync every 6 hours
// ────────────────────────────────────────────────────────────────────────────

import db from '../data/db.js';

// Guard: only run SQLite schema init if a real DB connection is available
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS media_catalog (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            tmdb_id           INTEGER NOT NULL,
            media_type        TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
            title             TEXT,
            poster_path       TEXT,
            backdrop_path     TEXT,
            overview          TEXT,
            vote_average      REAL    DEFAULT 0,
            vote_count        INTEGER DEFAULT 0,
            release_date      TEXT,
            genre_ids         TEXT,
            popularity        REAL    DEFAULT 0,
            original_language TEXT,
            category          TEXT,
            synced_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tmdb_id, media_type)
        );

        CREATE INDEX IF NOT EXISTS idx_catalog_category   ON media_catalog(category);
        CREATE INDEX IF NOT EXISTS idx_catalog_type       ON media_catalog(media_type);
        CREATE INDEX IF NOT EXISTS idx_catalog_popularity ON media_catalog(popularity DESC);
        CREATE INDEX IF NOT EXISTS idx_catalog_vote       ON media_catalog(vote_average DESC);
        CREATE INDEX IF NOT EXISTS idx_catalog_language   ON media_catalog(original_language);
        CREATE INDEX IF NOT EXISTS idx_catalog_synced     ON media_catalog(synced_at DESC);
    `);
} catch (e) {
    console.warn('[Sync] SQLite schema init skipped (no native DB):', e.message);
}

// Safe prepared statements — fallback to noop stubs when DB is unavailable
let upsertMediaStmt;
try {
    upsertMediaStmt = db.prepare(`
        INSERT INTO media_catalog (
            tmdb_id, media_type, title, poster_path, backdrop_path,
            overview, vote_average, vote_count, release_date, genre_ids,
            popularity, original_language, category, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
            title             = excluded.title,
            poster_path       = excluded.poster_path,
            backdrop_path     = excluded.backdrop_path,
            overview          = excluded.overview,
            vote_average      = excluded.vote_average,
            vote_count        = excluded.vote_count,
            release_date      = excluded.release_date,
            genre_ids         = excluded.genre_ids,
            popularity        = excluded.popularity,
            original_language = excluded.original_language,
            category          = excluded.category,
            synced_at         = CURRENT_TIMESTAMP
    `);
} catch (e) {
    upsertMediaStmt = { run: () => ({}) };
}

let getCatalogCountStmt;
try {
    getCatalogCountStmt = db.prepare(`SELECT COUNT(*) as count FROM media_catalog`);
} catch (e) {
    getCatalogCountStmt = { get: () => ({ count: 0 }) };
}

// ── TMDB Fetch Helper ────────────────────────────────────────────────────────
async function fetchTMDB(endpoint, params = {}) {
    if (!TMDB_KEY) throw new Error('[Sync] TMDB_KEY not set.');

    const url = new URL(TMDB_BASE + endpoint);
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Category Sync ────────────────────────────────────────────────────────────
async function syncCategory({ name, endpoint, params = {}, mediaType }) {
    let total = 0;
    console.log(`    ↳ [${name}]`);

    for (let page = 1; page <= SYNC_PAGES_PER_CATEGORY; page++) {
        try {
            const data = await fetchTMDB(endpoint, { ...params, page });
            const results = data?.results || [];
            if (!results.length) break;

            // Bulk-insert page results — use transaction when available, plain loop otherwise
            const insertBatch = (items) => {
                for (const item of items) {
                    const type = mediaType || item.media_type;
                    if (!type || !['movie', 'tv'].includes(type)) continue;
                    try {
                        upsertMediaStmt.run(
                            item.id,
                            type,
                            item.title || item.name || null,
                            item.poster_path || null,
                            item.backdrop_path || null,
                            (item.overview || '').substring(0, 1000),
                            item.vote_average || 0,
                            item.vote_count || 0,
                            item.release_date || item.first_air_date || null,
                            JSON.stringify(item.genre_ids || []),
                            item.popularity || 0,
                            item.original_language || null,
                            name
                        );
                    } catch {}
                }
            };

            if (typeof db.transaction === 'function') {
                db.transaction(insertBatch)(results);
            } else {
                insertBatch(results);
            }

            total += results.length;
            if (page >= (data.total_pages || 1)) break;
            await sleep(SYNC_DELAY_MS);
        } catch (err) {
            console.warn(`      ⚠ Error page ${page}: ${err.message}`);
            break;
        }
    }

    console.log(`      ✓ ${total} items synced`);
    return total;
}

// ── Category Definitions ─────────────────────────────────────────────────────
const SYNC_CATEGORIES = [
    // Trending
    { name: 'trending_day',     endpoint: '/trending/all/day',    mediaType: null },
    { name: 'trending_week',    endpoint: '/trending/all/week',   mediaType: null },

    // Movies
    { name: 'popular_movies',   endpoint: '/movie/popular',       mediaType: 'movie' },
    { name: 'top_rated_movies', endpoint: '/movie/top_rated',     mediaType: 'movie' },
    { name: 'now_playing',      endpoint: '/movie/now_playing',   mediaType: 'movie' },
    { name: 'upcoming',         endpoint: '/movie/upcoming',      mediaType: 'movie' },
    { name: 'hollywood',        endpoint: '/discover/movie',      mediaType: 'movie',
      params: { with_original_language: 'en', sort_by: 'popularity.desc' } },

    // TV Shows
    { name: 'popular_tv',       endpoint: '/tv/popular',          mediaType: 'tv' },
    { name: 'top_rated_tv',     endpoint: '/tv/top_rated',        mediaType: 'tv' },
    { name: 'on_the_air',       endpoint: '/tv/on_the_air',       mediaType: 'tv' },

    // Streaming Networks (TMDB network_id)
    { name: 'netflix',   endpoint: '/discover/tv', mediaType: 'tv', params: { with_networks: 213,  sort_by: 'popularity.desc' } },
    { name: 'prime',     endpoint: '/discover/tv', mediaType: 'tv', params: { with_networks: 1024, sort_by: 'popularity.desc' } },
    { name: 'disney',    endpoint: '/discover/tv', mediaType: 'tv', params: { with_networks: 2739, sort_by: 'popularity.desc' } },
    { name: 'hbo',       endpoint: '/discover/tv', mediaType: 'tv', params: { with_networks: 3186, sort_by: 'popularity.desc' } },
    { name: 'appletv',   endpoint: '/discover/tv', mediaType: 'tv', params: { with_networks: 2552, sort_by: 'popularity.desc' } },
    { name: 'hulu',      endpoint: '/discover/tv', mediaType: 'tv', params: { with_networks: 453,  sort_by: 'popularity.desc' } },

    // Languages
    { name: 'anime',     endpoint: '/discover/tv',    mediaType: 'tv',    params: { with_genres: 16, with_original_language: 'ja', sort_by: 'popularity.desc' } },
    { name: 'kdrama',    endpoint: '/discover/tv',    mediaType: 'tv',    params: { with_original_language: 'ko', sort_by: 'popularity.desc' } },
    { name: 'bollywood', endpoint: '/discover/movie', mediaType: 'movie', params: { with_original_language: 'hi', sort_by: 'popularity.desc' } },

    // Genres (TMDB genre IDs)
    { name: 'action',       endpoint: '/discover/movie', mediaType: 'movie', params: { with_genres: 28,  sort_by: 'popularity.desc' } },
    { name: 'comedy',       endpoint: '/discover/movie', mediaType: 'movie', params: { with_genres: 35,  sort_by: 'popularity.desc' } },
    { name: 'horror',       endpoint: '/discover/movie', mediaType: 'movie', params: { with_genres: 27,  sort_by: 'popularity.desc' } },
    { name: 'sci_fi',       endpoint: '/discover/movie', mediaType: 'movie', params: { with_genres: 878, sort_by: 'popularity.desc' } },
    { name: 'documentary',  endpoint: '/discover/movie', mediaType: 'movie', params: { with_genres: 99,  sort_by: 'popularity.desc' } },
];

// ── Main Sync Runner ─────────────────────────────────────────────────────────
export async function runFullSync() {
    const t0 = Date.now();
    const before = getCatalogCountStmt.get().count;
    const maxItems = SYNC_CATEGORIES.length * SYNC_PAGES_PER_CATEGORY * 20;

    console.log('\n╔═════════════════════════════════════════════════╗');
    console.log('║   CinePulse Content Sync Engine  🎬            ║');
    console.log('╚═════════════════════════════════════════════════╝');
    console.log(`  Catalog before : ${before.toLocaleString()} items`);
    console.log(`  Categories     : ${SYNC_CATEGORIES.length}`);
    console.log(`  Pages each     : ${SYNC_PAGES_PER_CATEGORY} (~${maxItems.toLocaleString()} items max)\n`);

    let grand = 0;
    for (const cat of SYNC_CATEGORIES) {
        grand += await syncCategory(cat);
    }

    const after = getCatalogCountStmt.get().count;
    const secs  = ((Date.now() - t0) / 1000).toFixed(1);

    console.log('\n╔═════════════════════════════════════════════════╗');
    console.log('║   Sync Complete ✅                              ║');
    console.log('╚═════════════════════════════════════════════════╝');
    console.log(`  Duration       : ${secs}s`);
    console.log(`  Processed      : ${grand.toLocaleString()} items`);
    console.log(`  New unique     : ${(after - before).toLocaleString()} added`);
    console.log(`  Total catalog  : ${after.toLocaleString()} unique titles`);
    console.log(`  Next sync in   : 6 hours\n`);
}

// ── Auto-Scheduler (call this from server/index.js) ───────────────────────────
export function startAutoSync() {
    // Run immediately on startup
    runFullSync().catch(err =>
        console.error('[Sync] Initial sync failed:', err.message)
    );
    // Then every 6 hours
    setInterval(() => {
        runFullSync().catch(err =>
            console.error('[Sync] Scheduled sync failed:', err.message)
        );
    }, SYNC_INTERVAL_MS);

    console.log('[Sync Engine] ✅ Auto-sync active — every 6 hours');
}

// ── Direct run (node server/sync/contentSync.js) ──────────────────────────────
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('contentSync')) {
    runFullSync()
        .then(() => process.exit(0))
        .catch(err => { console.error(err); process.exit(1); });
}
