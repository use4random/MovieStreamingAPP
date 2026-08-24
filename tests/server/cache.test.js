import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cache } from '../../server/utils/cache.js';

describe('Cache Layer Unit Tests', () => {
    it('should set and get values from cache correctly', async () => {
        const key = 'test:key:1';
        const data = { id: 42, title: 'Inception', score: 8.8 };

        const setSuccess = await cache.set(key, data, 60);
        assert.strictEqual(setSuccess, true);

        const retrieved = await cache.get(key);
        assert.deepStrictEqual(retrieved, data);
    });

    it('should return null for non-existent keys', async () => {
        const nonExistent = await cache.get('test:key:non_existent_' + Date.now());
        assert.strictEqual(nonExistent, null);
    });

    it('should handle null, undefined, or empty keys gracefully', async () => {
        assert.strictEqual(await cache.get(null), null);
        assert.strictEqual(await cache.get(''), null);
        assert.strictEqual(await cache.set(null, { test: 1 }), false);
        assert.strictEqual(await cache.set('valid_key', undefined), false);
        assert.strictEqual(await cache.set('valid_key', null), false);
    });

    it('should handle primitive types and nested objects', async () => {
        await cache.set('test:string', 'hello world', 60);
        assert.strictEqual(await cache.get('test:string'), 'hello world');

        await cache.set('test:number', 12345, 60);
        assert.strictEqual(await cache.get('test:number'), 12345);

        await cache.set('test:boolean', true, 60);
        assert.strictEqual(await cache.get('test:boolean'), true);

        await cache.set('test:array', [1, 2, 3], 60);
        assert.deepStrictEqual(await cache.get('test:array'), [1, 2, 3]);
    });
});
