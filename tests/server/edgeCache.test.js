import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { edgeCache } from '../../server/middleware/edgeCache.js';

function mockResponse() {
    const res = {
        headers: {},
        setHeader(k, v) {
            this.headers[k.toLowerCase()] = v;
            return this;
        }
    };
    return res;
}

describe('Edge CDN Cache Middleware Unit Tests', () => {
    it('should set Cache-Control header for GET requests', () => {
        const middleware = edgeCache(120, 300);
        const req = { method: 'GET' };
        const res = mockResponse();
        let nextCalled = false;

        middleware(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true);
        assert.ok(res.headers['cache-control']);
        assert.ok(res.headers['cache-control'].includes('s-maxage=120'));
        assert.ok(res.headers['cache-control'].includes('stale-while-revalidate=300'));
    });

    it('should not set Cache-Control header for POST/PUT/DELETE requests', () => {
        const middleware = edgeCache(300, 600);
        const req = { method: 'POST' };
        const res = mockResponse();
        let nextCalled = false;

        middleware(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true);
        assert.strictEqual(res.headers['cache-control'], undefined);
    });
});
