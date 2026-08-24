import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    UNIVERSES,
    getMediaUniverse,
    enrichMediaWithUniverse,
    enrichMediaListWithUniverse,
    sortItemsByUniverse
} from '../../server/data/universes.js';

describe('Universes Data Registry & Enrichment Unit Tests', () => {
    it('should have standard franchises defined in UNIVERSES', () => {
        assert.ok(UNIVERSES.MARVEL);
        assert.strictEqual(UNIVERSES.MARVEL.id, 'marvel');
        assert.ok(UNIVERSES.DC);
        assert.ok(UNIVERSES.STAR_WARS);
        assert.ok(UNIVERSES.WIZARDING_WORLD);
        assert.ok(UNIVERSES.MONSTERVERSE);
    });

    describe('getMediaUniverse()', () => {
        it('should correctly identify Marvel MCU title by TMDB ID', () => {
            const ironMan = { id: 1726, title: 'Iron Man', release_date: '2008-05-02' };
            const univ = getMediaUniverse(ironMan);

            assert.ok(univ);
            assert.strictEqual(univ.universe, 'Marvel');
            assert.strictEqual(univ.universeId, 'marvel');
            assert.strictEqual(univ.order, 1);
        });

        it('should correctly identify DC title by title and release year', () => {
            const darkKnight = { title: 'The Dark Knight', release_date: '2008-07-18' };
            const univ = getMediaUniverse(darkKnight);

            assert.ok(univ);
            assert.strictEqual(univ.universe, 'DC');
            assert.strictEqual(univ.universeId, 'dc');
        });

        it('should return null for non-franchise / standalone titles', () => {
            const standalone = { id: 99999999, title: 'Random Independent Film', release_date: '2023-01-01' };
            const univ = getMediaUniverse(standalone);
            assert.strictEqual(univ, null);
        });
    });

    describe('enrichMediaWithUniverse()', () => {
        it('should attach universe details and tag overview for recognized title', () => {
            const movie = {
                id: 1726,
                title: 'Iron Man',
                overview: 'A billionaire industrialist builds an armored suit.'
            };

            const enriched = enrichMediaWithUniverse(movie);
            assert.strictEqual(enriched.universe, 'Marvel');
            assert.strictEqual(enriched.universe_id, 'marvel');
            assert.ok(enriched.universe_details);
            assert.strictEqual(enriched.universe_details.phase, 'Phase 1');
            assert.ok(enriched.overview.includes('Universe: Marvel'));
        });

        it('should set null universe attributes for unrecognized title', () => {
            const movie = {
                id: 8888888,
                title: 'Unrelated Drama',
                overview: 'A regular story.'
            };

            const enriched = enrichMediaWithUniverse(movie);
            assert.strictEqual(enriched.universe, null);
            assert.strictEqual(enriched.universe_id, null);
            assert.strictEqual(enriched.universe_details, null);
            assert.strictEqual(enriched.overview, 'A regular story.');
        });
    });

    describe('sortItemsByUniverse()', () => {
        it('should order items chronologically according to canon universe order', () => {
            const items = [
                { id: 24428, title: 'The Avengers', universe_details: { order: 6 } },
                { id: 1726, title: 'Iron Man', universe_details: { order: 1 } },
                { id: 10138, title: 'Iron Man 2', universe_details: { order: 3 } }
            ];

            const sorted = sortItemsByUniverse(items);
            assert.strictEqual(sorted[0].title, 'Iron Man');
            assert.strictEqual(sorted[1].title, 'Iron Man 2');
            assert.strictEqual(sorted[2].title, 'The Avengers');
        });
    });
});
