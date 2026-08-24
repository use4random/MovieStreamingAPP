import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock document.cookie and localStorage for Node test runner environment
const mockStorage = new Map();
globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear()
};

globalThis.document = {
    cookie: ''
};

globalThis.window = {
    location: { origin: 'http://localhost:5173' }
};

import {
    IMG_W500,
    IMG_W780,
    IMG_ORIGINAL,
    FALLBACK_POSTER,
    FALLBACK_BACKDROP,
    getPoster,
    getBackdrop,
    getBackdropLarge,
    getYear,
    getRating,
    getCsrfToken,
    getGuestId
} from '../../client/src/services/api.js';

describe('Client API Utility & Media Helpers Unit Tests', () => {
    beforeEach(() => {
        mockStorage.clear();
        globalThis.document.cookie = '';
    });

    describe('Image URL Resolvers', () => {
        it('should return TMDB CDN url when valid path is provided', () => {
            const posterPath = '/path_to_poster.jpg';
            assert.strictEqual(getPoster(posterPath), `${IMG_W500}${posterPath}`);

            const backdropPath = '/path_to_backdrop.jpg';
            assert.strictEqual(getBackdrop(backdropPath), `${IMG_W780}${backdropPath}`);
            assert.strictEqual(getBackdropLarge(backdropPath), `${IMG_ORIGINAL}${backdropPath}`);
        });

        it('should return fallback SVG placeholder when image path is missing or null', () => {
            assert.strictEqual(getPoster(null), FALLBACK_POSTER);
            assert.strictEqual(getPoster(''), FALLBACK_POSTER);
            assert.strictEqual(getBackdrop(null), FALLBACK_BACKDROP);
            assert.strictEqual(getBackdropLarge(null), FALLBACK_BACKDROP);
        });
    });

    describe('Metadata Formatters', () => {
        it('should format release year correctly', () => {
            assert.strictEqual(getYear('2024-05-18'), '2024');
            assert.strictEqual(getYear('1999-12-31'), '1999');
            assert.strictEqual(getYear(null), '2026');
            assert.strictEqual(getYear(''), '2026');
        });

        it('should format ratings with 1 decimal precision', () => {
            assert.strictEqual(getRating(8.456), '8.5');
            assert.strictEqual(getRating(7), '7.0');
            assert.strictEqual(getRating(0), '0.0');
            assert.strictEqual(getRating(null), '8.0');
            assert.strictEqual(getRating(''), '8.0');
        });
    });

    describe('CSRF Token & Guest ID Management', () => {
        it('should extract CSRF token from document.cookie', () => {
            assert.strictEqual(getCsrfToken(), '');

            globalThis.document.cookie = 'other_cookie=xyz; csrf_token=test_csrf_token_value_123; session=abc';
            assert.strictEqual(getCsrfToken(), 'test_csrf_token_value_123');
        });

        it('should generate and persist guest ID in localStorage', () => {
            const guestId1 = getGuestId();
            assert.ok(guestId1.startsWith('guest_'));

            // Calling again returns the exact same cached guestId
            const guestId2 = getGuestId();
            assert.strictEqual(guestId1, guestId2);
        });
    });
});
