/**
 * 🔞 Isolated Adult / Mature Content Database Manager
 * Operates on an independent 'adult_catalog' table.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const dbPath = process.env.DATABASE_PATH || (isVercel ? '/tmp/cinepulse.db' : path.join(__dirname, '../../data/cinepulse.db'));

let db;

try {
    const { default: Database } = await import('better-sqlite3');
    db = new Database(isVercel ? ':memory:' : dbPath);
    if (!isVercel) {
        try { db.pragma('journal_mode = WAL'); } catch {}
    }
} catch (err) {
    console.warn('[Adult Module] Using DB fallback mock:', err.message);
    db = {
        exec: () => {},
        prepare: () => ({
            run: () => ({ changes: 1 }),
            get: () => ({ count: 0 }),
            all: () => []
        })
    };
}

// Create isolated adult catalog table
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS adult_catalog (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            tmdb_id           INTEGER NOT NULL,
            media_type        TEXT NOT NULL DEFAULT 'movie',
            title             TEXT NOT NULL,
            poster_path       TEXT,
            backdrop_path     TEXT,
            overview          TEXT,
            vote_average      REAL DEFAULT 0,
            release_date      TEXT,
            rating_label      TEXT DEFAULT '18+',
            category          TEXT DEFAULT 'mature',
            synced_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tmdb_id, media_type)
        );

        CREATE INDEX IF NOT EXISTS idx_adult_cat ON adult_catalog(category);
        CREATE INDEX IF NOT EXISTS idx_adult_rating ON adult_catalog(rating_label);
    `);
} catch {}

export const upsertAdultItemStmt = db.prepare(`
    INSERT INTO adult_catalog (
        tmdb_id, media_type, title, poster_path, backdrop_path,
        overview, vote_average, release_date, rating_label, category, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
        title         = excluded.title,
        poster_path   = excluded.poster_path,
        backdrop_path = excluded.backdrop_path,
        overview      = excluded.overview,
        vote_average  = excluded.vote_average,
        release_date  = excluded.release_date,
        rating_label  = excluded.rating_label,
        category      = excluded.category,
        synced_at     = CURRENT_TIMESTAMP
`);

export const getAdultCatalogStmt = db.prepare(`
    SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path,
           overview, vote_average, release_date, rating_label, category
    FROM adult_catalog
    ORDER BY synced_at DESC
    LIMIT ? OFFSET ?
`);

export const getAdultCountStmt = db.prepare(`SELECT COUNT(*) as count FROM adult_catalog`);

/**
 * Wipes all 18+ content records from database
 */
export function wipeAdultData() {
    try {
        db.exec(`DELETE FROM adult_catalog;`);
        console.log('[Adult Module] 🧹 adult_catalog records cleared cleanly.');
    } catch (e) {
        console.warn('[Adult Module] Wipe error:', e.message);
    }
}

export default db;
