import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}

const dbPath = process.env.DATABASE_PATH || (isVercel ? '/tmp/cinepulse.db' : path.join(dataDir, 'cinepulse.db'));

// Stateful memory fallback store
const memUsers = new Map();
const memWatchlists = new Map();
const memHistory = new Map();

let realDb = null;

try {
    const { default: Database } = await import('better-sqlite3');
    realDb = new Database(dbPath);
    try { realDb.pragma('journal_mode = WAL'); } catch {}
    try { realDb.pragma('foreign_keys = ON'); } catch {}
    console.log(`[Database] SQLite connected (${dbPath})`);
} catch (err) {
    console.warn('[Database Warning] Native better-sqlite3 unavailable, using stateful fallback engine:', err.message);
}

if (realDb) {
    try {
        realDb.exec(`
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
        `);
    } catch (e) {
        console.warn('[Database Warning] Failed to run SQLite schema init, using fallback:', e.message);
    }
}

// Universal Statement Handler with Sync to Memory
function createStmt(realSql, memHandler) {
    let preparedReal = null;
    if (realDb) {
        try {
            preparedReal = realDb.prepare(realSql);
        } catch (err) {
            console.warn('[Database Statement Warn] Sqlite prepare error:', err.message);
        }
    }

    return {
        run: (...args) => {
            let res = null;
            if (preparedReal) {
                try { res = preparedReal.run(...args); } catch (e) { console.warn('[DB Run Warn]', e.message); }
            }
            if (memHandler && memHandler.run) {
                try { memHandler.run(...args); } catch {}
            }
            return res || { changes: 1 };
        },
        get: (...args) => {
            if (preparedReal) {
                try {
                    const result = preparedReal.get(...args);
                    if (result !== undefined && result !== null) return result;
                } catch (e) { console.warn('[DB Get Warn]', e.message); }
            }
            return memHandler && memHandler.get ? memHandler.get(...args) : null;
        },
        all: (...args) => {
            if (preparedReal) {
                try {
                    const result = preparedReal.all(...args);
                    if (Array.isArray(result) && result.length > 0) return result;
                } catch (e) { console.warn('[DB All Warn]', e.message); }
            }
            return memHandler && memHandler.all ? memHandler.all(...args) : [];
        }
    };
}

// User Statements
export const createUserStmt = createStmt(
    `INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    {
        run: (id, username, email, password_hash, role) => {
            const user = { id, username, email, password_hash, role: role || 'user', created_at: new Date().toISOString() };
            memUsers.set(id, user);
            return { changes: 1 };
        }
    }
);

export const findUserByEmailStmt = createStmt(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`,
    {
        get: (email) => {
            const lower = (email || '').toLowerCase();
            for (const user of memUsers.values()) {
                if ((user.email || '').toLowerCase() === lower) return user;
            }
            return null;
        }
    }
);

export const findUserByUsernameStmt = createStmt(
    `SELECT * FROM users WHERE LOWER(username) = LOWER(?)`,
    {
        get: (username) => {
            const lower = (username || '').toLowerCase();
            for (const user of memUsers.values()) {
                if ((user.username || '').toLowerCase() === lower) return user;
            }
            return null;
        }
    }
);

export const findUserByIdStmt = createStmt(
    `SELECT id, username, email, role, created_at FROM users WHERE id = ?`,
    {
        get: (id) => memUsers.get(id) || null
    }
);

// Watchlist Statements
export const getWatchlistByUserIdStmt = createStmt(
    `SELECT item_json, added_at FROM watchlists WHERE user_id = ? ORDER BY added_at DESC`,
    {
        all: (userId) => {
            const list = memWatchlists.get(userId) || [];
            return list.map(item => ({ item_json: JSON.stringify(item), added_at: item.added_at || new Date().toISOString() }));
        }
    }
);

export const upsertWatchlistItemStmt = createStmt(
    `INSERT INTO watchlists (user_id, media_id, media_type, item_json, added_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, media_id, media_type) DO UPDATE SET item_json = excluded.item_json, added_at = CURRENT_TIMESTAMP`,
    {
        run: (userId, mediaId, mediaType, itemJson) => {
            const list = memWatchlists.get(userId) || [];
            const parsed = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
            const filtered = list.filter(i => !(String(i.id) === String(mediaId) && i.media_type === mediaType));
            filtered.unshift({ ...parsed, added_at: new Date().toISOString() });
            memWatchlists.set(userId, filtered);
            return { changes: 1 };
        }
    }
);

export const deleteWatchlistItemStmt = createStmt(
    `DELETE FROM watchlists WHERE user_id = ? AND media_id = ? AND media_type = ?`,
    {
        run: (userId, mediaId, mediaType) => {
            const list = memWatchlists.get(userId) || [];
            const filtered = list.filter(i => !(String(i.id) === String(mediaId) && i.media_type === mediaType));
            memWatchlists.set(userId, filtered);
            return { changes: 1 };
        }
    }
);

// History Statements
export const getHistoryByUserIdStmt = createStmt(
    `SELECT media_id as id, media_type, title, poster_path, backdrop_path, season, episode, progress_seconds as progressSeconds, duration_seconds as durationSeconds, updated_at as updatedAt FROM history WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`,
    {
        all: (userId) => memHistory.get(userId) || []
    }
);

export const upsertHistoryItemStmt = createStmt(
    `INSERT INTO history (user_id, media_id, media_type, title, poster_path, backdrop_path, season, episode, progress_seconds, duration_seconds, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, media_id, media_type) DO UPDATE SET title = excluded.title, poster_path = excluded.poster_path, backdrop_path = excluded.backdrop_path, season = excluded.season, episode = excluded.episode, progress_seconds = excluded.progress_seconds, duration_seconds = excluded.duration_seconds, updated_at = CURRENT_TIMESTAMP`,
    {
        run: (userId, mediaId, mediaType, title, posterPath, backdropPath, season, episode, progressSeconds, durationSeconds) => {
            const list = memHistory.get(userId) || [];
            const item = { id: mediaId, media_type: mediaType, title, poster_path: posterPath, backdrop_path: backdropPath, season, episode, progressSeconds, durationSeconds, updatedAt: new Date().toISOString() };
            const filtered = list.filter(i => !(String(i.id) === String(mediaId) && i.media_type === mediaType));
            filtered.unshift(item);
            memHistory.set(userId, filtered.slice(0, 50));
            return { changes: 1 };
        }
    }
);

export const upsertCoWatchStmt = createStmt(
    `INSERT INTO co_watch_matrix (item_a_id, item_a_type, item_b_id, item_b_type, co_count, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    { run: () => ({ changes: 1 }) }
);

export const getCoWatchedItemsStmt = createStmt(
    `SELECT item_b_id as id, item_b_type as media_type, co_count FROM co_watch_matrix WHERE item_a_id = ? AND item_a_type = ? ORDER BY co_count DESC LIMIT ?`,
    { all: () => [] }
);

export const getRecCacheStmt = createStmt(
    `SELECT results_json, computed_at FROM rec_cache WHERE seed_id = ? AND seed_type = ? AND user_id = ?`,
    { get: () => null }
);

export const setRecCacheStmt = createStmt(
    `INSERT INTO rec_cache (seed_id, seed_type, user_id, results_json, computed_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    { run: () => ({ changes: 1 }) }
);

export default realDb || { exec: () => {}, prepare: () => ({ run: () => ({}), get: () => null, all: () => [] }) };
