/**
 * Advanced Hybrid Recommendation Engine Router
 * Serves multi-signal personalized and content-similarity recommendations.
 */

import express from 'express';
import db, { 
    getHistoryByUserIdStmt, 
    getRecCacheStmt, 
    setRecCacheStmt 
} from '../data/db.js';
import { optionalAuth } from '../middleware/requireAuth.js';
import { scoreCandidate, diversifyResults } from '../utils/scorer.js';
import { getCoWatchedItems } from '../utils/cowatch.js';

const router = express.Router();

const TMDB_KEY = process.env.TMDB_KEY;
const TMDB_BASE = process.env.TMDB_BASE || 'https://api.themoviedb.org/3';

// Direct TMDB fetch helper
async function fetchTMDB(endpoint, params = {}) {
    if (!TMDB_KEY) return null;
    const url = new URL(TMDB_BASE + endpoint);
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * Fetch candidate pool from local SQLite catalog + TMDB similar/recommendations
 */
async function getCandidatePool(type, id, seedItem) {
    const candidateMap = new Map();

    // 1. Local catalog candidates matching genres or type
    try {
        const localRows = db.prepare(`
            SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path,
                   vote_average, vote_count, release_date, popularity, original_language,
                   genre_ids, overview
            FROM media_catalog
            ORDER BY popularity DESC
            LIMIT 150
        `).all();

        for (const row of localRows) {
            candidateMap.set(`${row.media_type}_${row.id}`, {
                ...row,
                genre_ids: typeof row.genre_ids === 'string' ? JSON.parse(row.genre_ids || '[]') : row.genre_ids
            });
        }
    } catch (e) {
        console.warn('[Rec API] Local catalog fetch fallback:', e.message);
    }

    // 2. Fetch TMDB Recommendations & Similar in parallel
    if (TMDB_KEY && id) {
        try {
            const [tmdbRecs, tmdbSimilar] = await Promise.all([
                fetchTMDB(`/${type}/${id}/recommendations`),
                fetchTMDB(`/${type}/${id}/similar`)
            ]);

            const externalItems = [
                ...(tmdbRecs?.results || []),
                ...(tmdbSimilar?.results || [])
            ];

            for (const item of externalItems) {
                if (!item || !item.id) continue;
                const mediaType = item.media_type || type;
                const key = `${mediaType}_${item.id}`;
                if (!candidateMap.has(key)) {
                    candidateMap.set(key, {
                        id: item.id,
                        media_type: mediaType,
                        title: item.title || item.name || 'Untitled',
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                        vote_average: item.vote_average || 0,
                        vote_count: item.vote_count || 0,
                        release_date: item.release_date || item.first_air_date || '',
                        popularity: item.popularity || 0,
                        original_language: item.original_language || 'en',
                        genre_ids: item.genre_ids || [],
                        overview: item.overview || ''
                    });
                }
            }
        } catch (e) {
            console.warn('[Rec API] External TMDB pool fetch failed:', e.message);
        }
    }

    return Array.from(candidateMap.values());
}

/**
 * GET /api/recommend/personal/feed
 * Generates a multi-row personalized recommendation feed for users.
 * MUST be declared BEFORE /:type/:id to prevent Express route collision.
 */
router.get('/personal/feed', optionalAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const history = (userId && userId !== 'guest') ? getHistoryByUserIdStmt.all(userId) : [];

        if (!history || history.length === 0) {
            // Fallback for new / guest users: Popular curated mix
            const fallbackRows = db.prepare(`
                SELECT tmdb_id as id, media_type, title, poster_path, backdrop_path,
                       vote_average, release_date, overview, category
                FROM media_catalog
                ORDER BY popularity DESC
                LIMIT 12
            `).all();

            return res.json({
                hasHistory: false,
                sections: [
                    {
                        title: '🔥 Popular Picks For You',
                        reason: 'Trending titles across CinePulse',
                        items: fallbackRows
                    }
                ]
            });
        }

        // Take top 3 recently watched titles as seeds
        const seedItems = history.slice(0, 3);
        const sections = [];

        for (const seed of seedItems) {
            const candidates = await getCandidatePool(seed.media_type || 'movie', seed.id, seed);
            const userHistoryIds = new Set(history.map(h => String(h.id)));

            const scored = candidates
                .filter(c => String(c.id) !== String(seed.id))
                .map(candidate => ({
                    item: candidate,
                    score: scoreCandidate({ candidate, seedItem: seed, userHistoryIds })
                }));

            const topForSeed = diversifyResults(scored, 8, 2);
            if (topForSeed.length > 0) {
                sections.push({
                    seedId: seed.id,
                    title: `Because You Watched "${seed.title || 'a title'}"`,
                    reason: `Based on your recent interest in ${seed.title}`,
                    items: topForSeed
                });
            }
        }

        res.json({
            hasHistory: true,
            sections
        });
    } catch (err) {
        console.error('[Personal Rec Feed Error]:', err.message);
        res.status(500).json({ error: 'Failed to generate personalized feed' });
    }
});

/**
 * GET /api/recommend/:type/:id
 * Returns hybrid scored and diversified recommendations for a specific title.
 */
router.get('/:type/:id', optionalAuth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.userId || 'guest';

        if (!['movie', 'tv'].includes(type) || !id) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        // Check SQLite rec_cache first (cache lifetime 15 minutes)
        try {
            const cached = getRecCacheStmt.get(String(id), type, userId);
            if (cached && cached.results_json) {
                const ageMinutes = (Date.now() - new Date(cached.computed_at).getTime()) / (1000 * 60);
                if (ageMinutes < 15) {
                    const parsed = JSON.parse(cached.results_json);
                    return res.json(parsed);
                }
            }
        } catch {
            // cache miss
        }

        // 1. Fetch seed media details
        let seedItem = null;
        if (TMDB_KEY) {
            seedItem = await fetchTMDB(`/${type}/${id}`);
        }

        // 2. Fetch user's watched items to penalize seen content
        const userHistory = userId !== 'guest' ? getHistoryByUserIdStmt.all(userId) : [];
        const userHistoryIds = new Set(userHistory.map(h => String(h.id)));

        // 3. Fetch Collaborative filtering matrix co-watched links
        const coWatchedList = getCoWatchedItems(id, type, 30);
        const coWatchMap = new Map();
        for (const item of coWatchedList) {
            coWatchMap.set(`${item.media_type}_${item.id}`, item.co_count);
        }
        const maxCoCount = Math.max(1, ...coWatchedList.map(i => i.co_count));

        // 4. Build candidate pool
        const candidates = await getCandidatePool(type, id, seedItem);

        // 5. Score candidates
        const scoredCandidates = candidates
            .filter(cand => String(cand.id) !== String(id) || cand.media_type !== type)
            .map(candidate => {
                const key = `${candidate.media_type}_${candidate.id}`;
                const rawCoCount = coWatchMap.get(key) || 0;
                const coWatchScore = rawCoCount / maxCoCount;

                const score = scoreCandidate({
                    candidate,
                    seedItem,
                    coWatchScore,
                    userHistoryIds
                });

                return { item: candidate, score };
            });

        // 6. Diversify top results
        const finalResults = diversifyResults(scoredCandidates, 12, 3);

        const responsePayload = {
            seed: {
                id: Number(id),
                type,
                title: seedItem?.title || seedItem?.name || 'Item'
            },
            algo: 'hybrid_vector_v1',
            reason: seedItem?.title ? `Because you watched ${seedItem.title || seedItem.name}` : 'Recommended For You',
            results: finalResults
        };

        // Cache in SQLite
        try {
            setRecCacheStmt.run(String(id), type, userId, JSON.stringify(responsePayload));
        } catch {
            // ignore cache write error
        }

        res.json(responsePayload);
    } catch (err) {
        console.error('[Rec API Error]:', err.message);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

export default router;
