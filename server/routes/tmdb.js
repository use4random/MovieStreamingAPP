import express from 'express';
import NodeCache from 'node-cache';
import { 
    UNIVERSES, 
    enrichMediaWithUniverse, 
    enrichMediaListWithUniverse, 
    sortItemsByUniverse 
} from '../data/universes.js';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes cache

const TMDB_KEY = process.env.TMDB_KEY || '1dc4cbf81f0accf4fa108820d551dafc';
const TMDB_BASE = process.env.TMDB_BASE || 'https://api.themoviedb.org/3';

// Helper for fetching TMDB with caching and timeout
async function fetchTMDB(endpoint, queryParams = {}, retries = 2) {
    const url = new URL(TMDB_BASE + endpoint);
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const cacheKey = url.toString();
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`TMDB error HTTP ${res.status}`);
            const data = await res.json();
            cache.set(cacheKey, data);
            return data;
        } catch (err) {
            if (attempt === retries) {
                console.warn(`TMDB fetch error for ${endpoint} after ${retries + 1} attempts:`, err.message);
                throw err;
            }
            // Wait 300ms before retrying
            await new Promise(r => setTimeout(r, 300));
        }
    }
}

// Helper to fetch verified Universe feed
async function getVerifiedUniverseFeed(universeKey, page = 1) {
    const universe = UNIVERSES[universeKey];
    if (!universe) return { page: 1, results: [], total_pages: 1, total_results: 0 };

    const pageSize = 20;
    const startIdx = (page - 1) * pageSize;
    const pagedItems = universe.items.slice(startIdx, startIdx + pageSize);

    const fetchedResults = await Promise.all(
        pagedItems.map(async (uItem) => {
            try {
                const mediaType = uItem.type || 'movie';
                const details = await fetchTMDB(`/${mediaType}/${uItem.tmdbId}`);
                if (details) {
                    details.media_type = mediaType;
                    return enrichMediaWithUniverse(details);
                }
            } catch (e) {
                // Fallback minimal object if TMDB call fails
            }
            return enrichMediaWithUniverse({
                id: uItem.tmdbId,
                title: uItem.title,
                name: uItem.title,
                media_type: uItem.type || 'movie',
                release_date: `${uItem.year}-01-01`,
                first_air_date: `${uItem.year}-01-01`,
                overview: `Official canon title in the ${universe.franchise}.`
            });
        })
    );

    return {
        page: Number(page),
        results: sortItemsByUniverse(fetchedResults.filter(Boolean)),
        total_pages: Math.ceil(universe.items.length / pageSize),
        total_results: universe.items.length
    };
}

// 1. Trending
router.get('/trending', async (req, res) => {
    try {
        const timeWindow = req.query.window || 'week'; // 'day' or 'week'
        const type = req.query.type || 'all';
        const page = req.query.page || 1;
        const data = await fetchTMDB(`/trending/${type}/${timeWindow}`, { page });
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        try {
            const fallback = await fetchTMDB('/movie/popular', { page: req.query.page || 1 });
            if (fallback && fallback.results) {
                fallback.results = enrichMediaListWithUniverse(fallback.results);
            }
            return res.json(fallback);
        } catch {
            res.status(200).json({ page: 1, results: [], total_pages: 0, total_results: 0 });
        }
    }
});

// 2. Popular & Top Rated Lists
router.get('/popular', async (req, res) => {
    try {
        const type = req.query.type || 'movie';
        const page = req.query.page || 1;
        const data = await fetchTMDB(`/${type}/popular`, { page });
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        try {
            const fallback = await fetchTMDB('/trending/all/week', { page: req.query.page || 1 });
            if (fallback && fallback.results) {
                fallback.results = enrichMediaListWithUniverse(fallback.results);
            }
            return res.json(fallback);
        } catch {
            res.status(200).json({ page: 1, results: [], total_pages: 0, total_results: 0 });
        }
    }
});

router.get('/top-rated', async (req, res) => {
    try {
        const type = req.query.type || 'movie';
        const page = req.query.page || 1;
        const data = await fetchTMDB(`/${type}/top_rated`, { page });
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        try {
            const fallback = await fetchTMDB(`/${req.query.type || 'movie'}/popular`, { page: req.query.page || 1 });
            if (fallback && fallback.results) {
                fallback.results = enrichMediaListWithUniverse(fallback.results);
            }
            return res.json(fallback);
        } catch {
            res.status(200).json({ page: 1, results: [], total_pages: 0, total_results: 0 });
        }
    }
});

router.get('/now-playing', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const data = await fetchTMDB('/movie/now_playing', { page });
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        try {
            const fallback = await fetchTMDB('/trending/movie/week', { page: req.query.page || 1 });
            if (fallback && fallback.results) {
                fallback.results = enrichMediaListWithUniverse(fallback.results);
            }
            return res.json(fallback);
        } catch {
            res.status(200).json({ page: 1, results: [], total_pages: 0, total_results: 0 });
        }
    }
});

router.get('/on-the-air', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const data = await fetchTMDB('/tv/on_the_air', { page });
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        try {
            const fallback = await fetchTMDB('/trending/tv/week', { page: req.query.page || 1 });
            if (fallback && fallback.results) {
                fallback.results = enrichMediaListWithUniverse(fallback.results);
            }
            return res.json(fallback);
        } catch {
            res.status(200).json({ page: 1, results: [], total_pages: 0, total_results: 0 });
        }
    }
});

// 3. Media Details with Trailers, Credits & Similar
router.get('/media/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await fetchTMDB(`/${type}/${id}`, {
            append_to_response: 'credits,videos,similar,recommendations'
        });
        if (data) {
            enrichMediaWithUniverse(data);
            if (data.similar?.results) {
                data.similar.results = enrichMediaListWithUniverse(data.similar.results);
            }
            if (data.recommendations?.results) {
                data.recommendations.results = enrichMediaListWithUniverse(data.recommendations.results);
            }
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch details for ${req.params.type} ${req.params.id}` });
    }
});

// 4. TV Season & Episode Details
router.get('/media/tv/:id/season/:season', async (req, res) => {
    try {
        const { id, season } = req.params;
        const data = await fetchTMDB(`/tv/${id}/season/${season}`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch season episodes' });
    }
});

// 5. Multi-Site Platform / Network Feeds & Universe Gateway
router.get('/platform/:platformId', async (req, res) => {
    try {
        const { platformId } = req.params;
        const page = req.query.page || 1;
        let data;

        switch (platformId) {
            // Verified Universe Feeds (Exact verified filmographies, no keyword pollution)
            case 'marvel':
                data = await getVerifiedUniverseFeed('MARVEL', page);
                break;
            case 'dc':
                data = await getVerifiedUniverseFeed('DC', page);
                break;
            case 'starwars':
                data = await getVerifiedUniverseFeed('STAR_WARS', page);
                break;
            case 'wizarding_world':
                data = await getVerifiedUniverseFeed('WIZARDING_WORLD', page);
                break;
            case 'monsterverse':
                data = await getVerifiedUniverseFeed('MONSTERVERSE', page);
                break;
            case 'middle_earth':
                data = await getVerifiedUniverseFeed('MIDDLE_EARTH', page);
                break;
            case 'spider_verse':
                data = await getVerifiedUniverseFeed('SPIDER_VERSE', page);
                break;
            case 'xmen':
                data = await getVerifiedUniverseFeed('XMEN', page);
                break;
            case 'fast_and_furious':
                data = await getVerifiedUniverseFeed('FAST_AND_FURIOUS', page);
                break;
            case 'john_wick':
                data = await getVerifiedUniverseFeed('JOHN_WICK', page);
                break;

            // Platform and Network Feeds
            case 'trending_day':
                data = await fetchTMDB('/trending/all/day', { page });
                break;
            case 'hollywood':
                data = await fetchTMDB('/discover/movie', { with_original_language: 'en', sort_by: 'popularity.desc', page });
                break;
            case 'netflix':
                data = await fetchTMDB('/discover/tv', { with_networks: 213, sort_by: 'popularity.desc', page });
                break;
            case 'prime':
                data = await fetchTMDB('/discover/tv', { with_networks: 1024, sort_by: 'popularity.desc', page });
                break;
            case 'disney':
                data = await fetchTMDB('/discover/tv', { with_networks: 2739, sort_by: 'popularity.desc', page });
                break;
            case 'hbo':
                data = await fetchTMDB('/discover/tv', { with_networks: 3186, sort_by: 'popularity.desc', page });
                break;
            case 'appletv':
                data = await fetchTMDB('/discover/tv', { with_networks: 2552, sort_by: 'popularity.desc', page });
                break;
            case 'paramount':
                data = await fetchTMDB('/discover/tv', { with_networks: 4330, sort_by: 'popularity.desc', page });
                break;
            case 'anime_hub':
                data = await fetchTMDB('/discover/tv', { with_genres: 16, with_original_language: 'ja', sort_by: 'popularity.desc', page });
                break;
            case 'kdrama':
                data = await fetchTMDB('/discover/tv', { with_original_language: 'ko', sort_by: 'popularity.desc', page });
                break;
            case 'bollywood':
                data = await fetchTMDB('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', page });
                break;
            default:
                data = await fetchTMDB('/trending/all/week', { page });
        }

        if (data && data.results && !['marvel', 'dc', 'starwars', 'wizarding_world', 'monsterverse', 'middle_earth', 'spider_verse', 'xmen', 'fast_and_furious', 'john_wick'].includes(platformId)) {
            data.results = enrichMediaListWithUniverse(data.results);
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch platform feed' });
    }
});

// 6. Generic Discover with Filtering
router.get('/discover', async (req, res) => {
    try {
        const type = req.query.mediaType || 'movie';
        const params = {
            page: req.query.page || 1,
            sort_by: req.query.sortBy || 'popularity.desc'
        };
        if (req.query.genreId && req.query.genreId !== '0') params.with_genres = req.query.genreId;
        if (req.query.year) params.primary_release_year = req.query.year;
        if (req.query.minRating) params['vote_average.gte'] = req.query.minRating;
        if (req.query.lang) params.with_original_language = req.query.lang;

        const data = await fetchTMDB(`/discover/${type}`, params);
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to discover media' });
    }
});

// 7. Multi-Search
router.get('/search', async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        if (!query) return res.json({ results: [] });
        const data = await fetchTMDB('/search/multi', { query, page });
        if (data && data.results) {
            data.results = enrichMediaListWithUniverse(data.results);
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

// 8. Genre List
router.get('/genres', async (req, res) => {
    try {
        const type = req.query.type || 'movie';
        const data = await fetchTMDB(`/genre/${type}/list`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch genre list' });
    }
});

export default router;

