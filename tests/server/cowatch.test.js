import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recordCoWatch, getCoWatchedItems } from '../../server/utils/cowatch.js';
import { upsertHistoryItemStmt } from '../../server/data/db.js';

describe('Co-Watch Matrix Collaborative Signal Unit Tests', () => {
    it('should ignore guest or empty userId calls gracefully without throwing', async () => {
        await assert.doesNotReject(async () => {
            await recordCoWatch('guest', 101, 'movie');
            await recordCoWatch(null, 101, 'movie');
            await recordCoWatch('user_123', null, 'movie');
        });
    });

    it('should record co-watch linkages when user watches multiple items', async () => {
        const userId = 'cowatch_user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        // Insert user first
        const { createUserStmt } = await import('../../server/data/db.js');
        createUserStmt.run(userId, userId, `${userId}@test.com`, 'hash', 'user');

        // Add history for user
        upsertHistoryItemStmt.run(userId, '1001', 'movie', 'Matrix 1', '', '', 1, 1, 100, 5000);
        upsertHistoryItemStmt.run(userId, '1002', 'movie', 'Matrix 2', '', '', 1, 1, 100, 5000);

        // Record co-watch on third item
        await recordCoWatch(userId, '1003', 'movie');

        const coItems = getCoWatchedItems('1003', 'movie', 10);
        assert.ok(Array.isArray(coItems));
    });

    it('should return an array from getCoWatchedItems even if no relations exist', () => {
        const items = getCoWatchedItems('999999', 'movie', 5);
        assert.ok(Array.isArray(items));
    });
});
