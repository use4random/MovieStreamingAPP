import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import collectionsRouter from '../../server/routes/collections.js';

describe('Collections API & Hubs Data Integrity Tests', () => {
    it('should have collections router defined', () => {
        assert.ok(collectionsRouter);
        assert.strictEqual(typeof collectionsRouter, 'function');
    });

    it('should properly serve collections list and single collection lookup', async () => {
        // Test router handler directly
        const reqAll = { method: 'GET', url: '/' };
        let sentData = null;
        const resAll = {
            json(data) {
                sentData = data;
                return this;
            }
        };

        // Find the route handler for '/'
        const rootLayer = collectionsRouter.stack.find(s => s.route && s.route.path === '/');
        assert.ok(rootLayer);
        const rootHandler = rootLayer.route.stack[0].handle;
        rootHandler(reqAll, resAll);

        assert.ok(Array.isArray(sentData));
        assert.ok(sentData.length > 5);

        // Verify structure of each collection
        for (const col of sentData) {
            assert.ok(col.id, 'Collection must have an id');
            assert.ok(col.name, 'Collection must have a name');
            assert.ok(col.tag, 'Collection must have a tag');
            assert.ok(col.category, 'Collection must have a category');
            assert.ok(col.desc, 'Collection must have a desc');
            assert.ok(col.backdrop, 'Collection must have a backdrop image');
        }

        // Test single item route handler
        const idLayer = collectionsRouter.stack.find(s => s.route && s.route.path === '/:id');
        assert.ok(idLayer);
        const idHandler = idLayer.route.stack[0].handle;

        let singleData = null;
        const reqSingle = { params: { id: 'marvel' } };
        const resSingle = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) { singleData = data; return this; }
        };

        idHandler(reqSingle, resSingle);
        assert.strictEqual(resSingle.statusCode, 200);
        assert.strictEqual(singleData.id, 'marvel');
        assert.strictEqual(singleData.universe, 'Marvel');

        // Test non-existent ID
        let errorData = null;
        const reqNotFound = { params: { id: 'non_existent_collection_xyz' } };
        const resNotFound = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) { errorData = data; return this; }
        };

        idHandler(reqNotFound, resNotFound);
        assert.strictEqual(resNotFound.statusCode, 404);
        assert.ok(errorData?.error);
    });
});
