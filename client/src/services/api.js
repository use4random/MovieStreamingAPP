const API_BASE = import.meta.env.VITE_API_BASE || '/api';


export const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
export const IMG_W780 = 'https://image.tmdb.org/t/p/w780';
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

export const FALLBACK_POSTER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" fill="%230c0d18"><rect width="300" height="450"/><text x="150" y="225" text-anchor="middle" fill="%23445" font-family="sans-serif" font-size="16" font-weight="bold">NO POSTER AVAILABLE</text></svg>');
export const FALLBACK_BACKDROP = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" fill="%230c0d18"><rect width="800" height="450"/><text x="400" y="225" text-anchor="middle" fill="%23445" font-family="sans-serif" font-size="20">FEED OFFLINE</text></svg>');

export function getPoster(path) {
    return path ? `${IMG_W500}${path}` : FALLBACK_POSTER;
}

export function getBackdrop(path) {
    return path ? `${IMG_W780}${path}` : FALLBACK_BACKDROP;
}

export function getBackdropLarge(path) {
    return path ? `${IMG_ORIGINAL}${path}` : FALLBACK_BACKDROP;
}

export function getYear(date) {
    return date ? date.substring(0, 4) : '2026';
}

export function getRating(vote) {
    return vote ? Number(vote).toFixed(1) : '8.0';
}

async function request(endpoint, params = {}) {
    const url = new URL(API_BASE + endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn(`API error for ${endpoint}:`, err);
        return null;
    }
}

export const api = {
    getTrending: (type = 'all', window = 'week', page = 1) => request('/trending', { type, window, page }),
    getPopular: (type = 'movie', page = 1) => request('/popular', { type, page }),
    getTopRated: (type = 'movie', page = 1) => request('/top-rated', { type, page }),
    getNowPlaying: (page = 1) => request('/now-playing', { page }),
    getOnTheAir: (page = 1) => request('/on-the-air', { page }),
    getMediaDetails: (type, id) => request(`/media/${type}/${id}`),
    getSeasonDetails: (id, season) => request(`/media/tv/${id}/season/${season}`),
    getPlatformFeed: (platformId, page = 1) => request(`/platform/${platformId}`, { page }),
    getDiscover: (params) => request('/discover', params),
    search: (query, page = 1) => request('/search', { query, page }),
    getGenres: (type = 'movie') => request('/genres', { type }),
    getCollections: () => request('/collections'),
    getServers: (type, id, season, episode) => request('/servers', { type, id, season, episode }),
    getServerHealth: () => request('/servers/health'),
};
