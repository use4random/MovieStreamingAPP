/**
 * 🔞 Isolated Adult / Mature Content Scraper
 * Fetches 18+ / NC-17 / TV-MA titles and populates adult_catalog.
 */

import { upsertAdultItemStmt, getAdultCountStmt } from './db.js';
import 'dotenv/config';

const TMDB_KEY = process.env.TMDB_KEY;
const TMDB_BASE = process.env.TMDB_BASE || 'https://api.themoviedb.org/3';

async function fetchTMDB(endpoint, params = {}) {
    if (!TMDB_KEY) return null;
    const url = new URL(TMDB_BASE + endpoint);
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('include_adult', 'true'); // Fetch adult/18+ content

    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`[Adult Scraper] Fetch error for ${endpoint}:`, err.message);
        return null;
    }
}

/**
 * Scrapes 18+ / NC-17 / TV-MA mature content into the isolated database table.
 */
export async function syncAdultContent() {
    if (!TMDB_KEY) {
        console.warn('[Adult Scraper] TMDB_KEY is missing, skipping adult sync.');
        return 0;
    }

    console.log('[Adult Scraper] 🔞 Starting isolated 18+ content sync...');

    let syncedCount = 0;

    // Categories of mature content
    const feeds = [
        { endpoint: '/discover/movie', params: { include_adult: 'true', certification_country: 'US', 'certification.gte': 'NC-17', sort_by: 'popularity.desc' }, label: 'NC-17 Cinema' },
        { endpoint: '/discover/movie', params: { include_adult: 'true', with_genres: '27', sort_by: 'popularity.desc' }, label: 'Uncut Horror (18+)' },
        { endpoint: '/discover/tv',    params: { include_adult: 'true', with_genres: '80', sort_by: 'popularity.desc' }, label: 'Mature TV-MA Thrillers' },
        { endpoint: '/discover/movie', params: { include_adult: 'true', with_keywords: '9799', sort_by: 'popularity.desc' }, label: 'Erotic Thrillers' }
    ];

    for (const feed of feeds) {
        for (let page = 1; page <= 3; page++) {
            const data = await fetchTMDB(feed.endpoint, { ...feed.params, page });
            const results = data?.results || [];

            for (const item of results) {
                if (!item || !item.id) continue;

                upsertAdultItemStmt.run(
                    item.id,
                    item.media_type || (feed.endpoint.includes('/tv') ? 'tv' : 'movie'),
                    item.title || item.name || 'Untitled 18+',
                    item.poster_path || null,
                    item.backdrop_path || null,
                    (item.overview || '18+ Mature Content').substring(0, 1000),
                    item.vote_average || 0,
                    item.release_date || item.first_air_date || '',
                    '18+',
                    feed.label
                );

                syncedCount++;
            }
        }
    }

    const total = getAdultCountStmt.get().count;
    console.log(`[Adult Scraper] ✅ 18+ Sync complete. Total 18+ catalog: ${total} items.`);
    return total;
}
