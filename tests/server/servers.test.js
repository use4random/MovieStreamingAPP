import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cache } from '../../server/utils/cache.js';
import serversRouter from '../../server/routes/servers.js';

function getRouteHandler(router, method, path) {
    const layer = router.stack.find(s => s.route && s.route.path === path && s.route.methods[method.toLowerCase()]);
    if (!layer) throw new Error(`Route not found: ${method} ${path}`);
    return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockResponse() {
    const res = {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; }
    };
    return res;
}

describe('Streaming Servers Node Provider Unit Tests', () => {
    it('should generate valid streaming embed URLs for movie and tv endpoints', async () => {
        // Pre-seed health cache to avoid external network pings during unit tests
        await cache.set('server-health', {
            nodes: [
                { id: 'vidlink', name: 'VidLink HD', healthy: true, responseTime: 8 },
                { id: '2embed', name: '2Embed Stream', healthy: true, responseTime: 10 },
                { id: 'videasy', name: 'Videasy HD', healthy: true, responseTime: 11 }
            ]
        }, 300);

        const rootHandler = getRouteHandler(serversRouter, 'GET', '/');

        // Test movie URL generation
        const reqMovie = { query: { type: 'movie', id: '1726' } };
        const resMovie = mockResponse();
        await rootHandler(reqMovie, resMovie);

        assert.strictEqual(resMovie.statusCode, 200);
        assert.ok(Array.isArray(resMovie.data));
        assert.ok(resMovie.data.length > 0);

        for (const s of resMovie.data) {
            assert.ok(s.id);
            assert.ok(s.name);
            assert.ok(s.url);
            assert.ok(s.url.includes('1726'));
        }

        // Test TV series URL generation with season and episode
        const reqTv = { query: { type: 'tv', id: '1399', season: '2', episode: '4' } };
        const resTv = mockResponse();
        await rootHandler(reqTv, resTv);

        assert.strictEqual(resTv.statusCode, 200);
        assert.ok(Array.isArray(resTv.data));
        for (const s of resTv.data) {
            assert.ok(s.url.includes('1399'));
        }
    });
});
