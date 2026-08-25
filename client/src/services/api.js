const API_BASE = (import.meta.env?.VITE_API_BASE || '/api').replace(/\/$/, '');

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
    return date ? String(date).substring(0, 4) : '2026';
}

export function getRating(vote) {
    return (vote !== undefined && vote !== null && vote !== '') ? Number(vote).toFixed(1) : '8.0';
}

// Get CSRF double-submit token from readable cookie
export function getCsrfToken() {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// Get guest fallback ID
export function getGuestId() {
    if (typeof localStorage === 'undefined') return 'guest_default';
    let guestId = localStorage.getItem('cinepulse_guest_id');
    if (!guestId) {
        guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('cinepulse_guest_id', guestId);
    }
    return guestId;
}

function getHeaders(includeCsrf = false) {
    const headers = { 'Content-Type': 'application/json' };
    headers['X-Guest-ID'] = getGuestId();
    if (includeCsrf) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return headers;
}

async function request(endpoint, params = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    const url = new URL(`${API_BASE}${cleanEndpoint}`, baseUrl);

    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    try {
        const res = await fetch(url, {
            headers: getHeaders(false),
            credentials: 'include'
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.warn(`API error for ${endpoint}:`, err.message);
        return null;
    }
}

async function requestMutate(endpoint, method = 'POST', body = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    const url = new URL(`${API_BASE}${cleanEndpoint}`, baseUrl);

    try {
        const res = await fetch(url, {
            method,
            headers: getHeaders(true),
            credentials: 'include',
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
    } catch (err) {
        console.warn(`API mutation error for ${endpoint}:`, err.message);
        throw err;
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
    getServers: (type, id, season = 1, episode = 1, imdb) => request('/servers', { type, id, season, episode, imdb }),
    getServerHealth: () => request('/servers/health'),

    // Authentication APIs
    register: (username, email, password) => requestMutate('/auth/register', 'POST', { username, email, password }),
    login: (identifier, password) => requestMutate('/auth/login', 'POST', { identifier, password }),
    logout: () => requestMutate('/auth/logout', 'POST'),
    getCurrentUser: () => request('/auth/me'),

    // User Persistence & History APIs (server derives userId from verified JWT token)
    getWatchlist: () => request('/user/watchlist'),
    saveWatchlist: (item) => requestMutate('/user/watchlist', 'POST', { item }),
    removeWatchlist: (id, mediaType) => requestMutate('/user/watchlist', 'DELETE', { id, mediaType }),
    getPlaybackHistory: () => request('/user/history'),
    updatePlaybackProgress: (payload) => requestMutate('/user/history', 'POST', payload),

    // Advanced Recommendation Engine APIs
    getRecommendations: (type, id) => request(`/recommend/${type}/${id}`),
    getPersonalFeed: () => request('/recommend/personal/feed'),
};
