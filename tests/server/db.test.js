import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    createUserStmt,
    findUserByEmailStmt,
    findUserByUsernameStmt,
    findUserByIdStmt,
    upsertWatchlistItemStmt,
    getWatchlistByUserIdStmt,
    deleteWatchlistItemStmt,
    upsertHistoryItemStmt,
    getHistoryByUserIdStmt
} from '../../server/data/db.js';

describe('Database Statement Handlers Unit Tests', () => {
    const testUserId = 'test_user_' + Date.now();
    const testEmail = `test_${Date.now()}@example.com`;
    const testUsername = `user_${Date.now()}`;

    describe('User Operations', () => {
        it('should create and retrieve a user', () => {
            createUserStmt.run(testUserId, testUsername, testEmail, 'hashedpassword123', 'user');

            const byEmail = findUserByEmailStmt.get(testEmail);
            assert.ok(byEmail);
            assert.strictEqual(byEmail.id, testUserId);
            assert.strictEqual(byEmail.username, testUsername);

            // Case-insensitive email lookup
            const byEmailUpper = findUserByEmailStmt.get(testEmail.toUpperCase());
            assert.ok(byEmailUpper);
            assert.strictEqual(byEmailUpper.id, testUserId);

            const byUsername = findUserByUsernameStmt.get(testUsername);
            assert.ok(byUsername);
            assert.strictEqual(byUsername.id, testUserId);

            const byId = findUserByIdStmt.get(testUserId);
            assert.ok(byId);
            assert.strictEqual(byId.email, testEmail);
        });

        it('should return null or undefined for non-existent user queries', () => {
            assert.ok(!findUserByEmailStmt.get('doesnotexist@nowhere.xyz'));
            assert.ok(!findUserByUsernameStmt.get('ghost_user_xyz_999'));
            assert.ok(!findUserByIdStmt.get('ghost_id_0000'));
        });
    });

    describe('Watchlist Operations', () => {
        it('should add, retrieve, and delete items from watchlist', () => {
            const item = { id: 550, title: 'Fight Club', poster_path: '/poster.jpg', media_type: 'movie' };

            upsertWatchlistItemStmt.run(testUserId, '550', 'movie', JSON.stringify(item));

            const list = getWatchlistByUserIdStmt.all(testUserId);
            assert.ok(Array.isArray(list));
            assert.ok(list.length >= 1);

            const parsedItems = list.map(entry => typeof entry.item_json === 'string' ? JSON.parse(entry.item_json) : entry.item_json);
            assert.ok(parsedItems.some(i => String(i.id) === '550'));

            // Delete item
            deleteWatchlistItemStmt.run(testUserId, '550', 'movie');
            const listAfter = getWatchlistByUserIdStmt.all(testUserId);
            const parsedAfter = listAfter.map(entry => typeof entry.item_json === 'string' ? JSON.parse(entry.item_json) : entry.item_json);
            assert.ok(!parsedAfter.some(i => String(i.id) === '550'));
        });
    });

    describe('Playback History Operations', () => {
        it('should insert and fetch playback history', () => {
            upsertHistoryItemStmt.run(
                testUserId,
                '600',
                'movie',
                'Interstellar',
                '/poster.jpg',
                '/backdrop.jpg',
                1,
                1,
                1200.5,
                9000
            );

            const history = getHistoryByUserIdStmt.all(testUserId);
            assert.ok(Array.isArray(history));
            assert.ok(history.length >= 1);
            const found = history.find(h => String(h.id) === '600');
            assert.ok(found);
            assert.strictEqual(found.title, 'Interstellar');
        });
    });
});
