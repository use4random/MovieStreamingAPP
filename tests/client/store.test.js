import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useCinePulseStore } from '../../client/src/store/useCinePulseStore.js';

describe('Zustand Global Store Unit Tests', () => {
    beforeEach(() => {
        // Reset state before each test
        useCinePulseStore.setState({
            searchOpen: false,
            activeHub: 'trending',
            currentMedia: null
        });
    });

    describe('Search Modal State', () => {
        it('should open, close, and toggle search modal state', () => {
            const state = useCinePulseStore.getState();
            assert.strictEqual(state.searchOpen, false);

            state.openSearch();
            assert.strictEqual(useCinePulseStore.getState().searchOpen, true);

            state.closeSearch();
            assert.strictEqual(useCinePulseStore.getState().searchOpen, false);

            state.toggleSearch();
            assert.strictEqual(useCinePulseStore.getState().searchOpen, true);

            state.toggleSearch();
            assert.strictEqual(useCinePulseStore.getState().searchOpen, false);
        });
    });

    describe('Active Hub State', () => {
        it('should update active homepage hub', () => {
            assert.strictEqual(useCinePulseStore.getState().activeHub, 'trending');

            useCinePulseStore.getState().setActiveHub('marvel');
            assert.strictEqual(useCinePulseStore.getState().activeHub, 'marvel');

            useCinePulseStore.getState().setActiveHub('anime_hub');
            assert.strictEqual(useCinePulseStore.getState().activeHub, 'anime_hub');
        });
    });

    describe('Player Media State', () => {
        it('should set and clear current active playing media', () => {
            assert.strictEqual(useCinePulseStore.getState().currentMedia, null);

            const mediaItem = {
                id: 1726,
                type: 'movie',
                title: 'Iron Man',
                year: '2008'
            };

            useCinePulseStore.getState().setCurrentMedia(mediaItem);
            assert.deepStrictEqual(useCinePulseStore.getState().currentMedia, mediaItem);

            useCinePulseStore.getState().clearCurrentMedia();
            assert.strictEqual(useCinePulseStore.getState().currentMedia, null);
        });
    });
});
