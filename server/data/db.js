import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data folder exists
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}

const isVercel = Boolean(process.env.VERCEL);
const dbPath = process.env.DATABASE_PATH || (isVercel ? '/tmp/cinepulse.db' : path.join(dataDir, 'cinepulse.db'));

let db;

// Safely load better-sqlite3 with fallback mock for Vercel Serverless environments
try {
    const { default: Database } = await import('better-sqlite3');
    db = new Database(isVercel ? ':memory:' : dbPath);
    if (!isVercel) {
        try { db.pragma('journal_mode = WAL'); } catch {}
    }
    try { db.pragma('foreign_keys = ON'); } catch {}
    console.log(`[Database] SQLite connected (${isVercel ? 'in-memory' : dbPath})`);
} catch (err) {
    console.warn('[Database Warning] better-sqlite3 native addon unavailable on Vercel, using fallback DB mock:', err.message);
    
    // In-Memory fallback mock for Vercel serverless functions
    db = {
        exec: () => {},
        pragma: () => {},
        prepare: () => ({
            run: () => ({ changes: 1 }),
            get: () => null,
            all: () => []
        }),
        transaction: (fn) => (...args) => fn(...args)
    };
}

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        media_id TEXT NOT NULL,
        media_type TEXT NOT NULL,
        item_json TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, media_id, media_type),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        media_id TEXT NOT NULL,
        media_type TEXT NOT NULL,
        title TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        season INTEGER DEFAULT 1,
        episode INTEGER DEFAULT 1,
        progress_seconds REAL DEFAULT 0,
        duration_seconds REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, media_id, media_type),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS co_watch_matrix (
        item_a_id    TEXT NOT NULL,
        item_a_type  TEXT NOT NULL,
        item_b_id    TEXT NOT NULL,
        item_b_type  TEXT NOT NULL,
        co_count     INTEGER DEFAULT 1,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (item_a_id, item_a_type, item_b_id, item_b_type)
    );

    CREATE TABLE IF NOT EXISTS rec_cache (
        seed_id      TEXT NOT NULL,
        seed_type    TEXT NOT NULL,
        user_id      TEXT NOT NULL DEFAULT 'guest',
        results_json TEXT NOT NULL,
        algo_version TEXT DEFAULT 'hybrid_v1',
        computed_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (seed_id, seed_type, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
    CREATE INDEX IF NOT EXISTS idx_cowatch_a ON co_watch_matrix(item_a_id, item_a_type, co_count DESC);
`);

// Prepared statement helpers
export const createUserStmt = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
`);

export const findUserByEmailStmt = db.prepare(`
    SELECT * FROM users WHERE LOWER(email) = LOWER(?)
`);

export const findUserByUsernameStmt = db.prepare(`
    SELECT * FROM users WHERE LOWER(username) = LOWER(?)
`);

export const findUserByIdStmt = db.prepare(`
    SELECT id, username, email, role, created_at FROM users WHERE id = ?
`);

// Watchlist
export const getWatchlistByUserIdStmt = db.prepare(`
    SELECT item_json, added_at FROM watchlists 
    WHERE user_id = ? 
    ORDER BY added_at DESC
`);

export const upsertWatchlistItemStmt = db.prepare(`
    INSERT INTO watchlists (user_id, media_id, media_type, item_json, added_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, media_id, media_type) DO UPDATE SET
        item_json = excluded.item_json,
        added_at = CURRENT_TIMESTAMP
`);

export const deleteWatchlistItemStmt = db.prepare(`
    DELETE FROM watchlists 
    WHERE user_id = ? AND media_id = ? AND media_type = ?
`);

// History
export const getHistoryByUserIdStmt = db.prepare(`
    SELECT media_id as id, media_type, title, poster_path, backdrop_path, season, episode, progress_seconds as progressSeconds, duration_seconds as durationSeconds, updated_at as updatedAt
    FROM history 
    WHERE user_id = ? 
    ORDER BY updated_at DESC
    LIMIT 50
`);

export const upsertHistoryItemStmt = db.prepare(`
    INSERT INTO history (user_id, media_id, media_type, title, poster_path, backdrop_path, season, episode, progress_seconds, duration_seconds, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, media_id, media_type) DO UPDATE SET
        title = excluded.title,
        poster_path = excluded.poster_path,
        backdrop_path = excluded.backdrop_path,
        season = excluded.season,
        episode = excluded.episode,
        progress_seconds = excluded.progress_seconds,
        duration_seconds = excluded.duration_seconds,
        updated_at = CURRENT_TIMESTAMP
`);

// Co-watch Matrix Statements
export const upsertCoWatchStmt = db.prepare(`
    INSERT INTO co_watch_matrix (item_a_id, item_a_type, item_b_id, item_b_type, co_count, updated_at)
    VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(item_a_id, item_a_type, item_b_id, item_b_type) DO UPDATE SET
        co_count = co_count + 1,
        updated_at = CURRENT_TIMESTAMP
`);

export const getCoWatchedItemsStmt = db.prepare(`
    SELECT item_b_id as id, item_b_type as media_type, co_count
    FROM co_watch_matrix
    WHERE item_a_id = ? AND item_a_type = ?
    ORDER BY co_count DESC
    LIMIT ?
`);

// Recommendation Cache Statements
export const getRecCacheStmt = db.prepare(`
    SELECT results_json, computed_at FROM rec_cache
    WHERE seed_id = ? AND seed_type = ? AND user_id = ?
`);

export const setRecCacheStmt = db.prepare(`
    INSERT INTO rec_cache (seed_id, seed_type, user_id, results_json, computed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(seed_id, seed_type, user_id) DO UPDATE SET
        results_json = excluded.results_json,
        computed_at = CURRENT_TIMESTAMP
`);

export default db;
