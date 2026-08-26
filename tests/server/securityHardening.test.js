import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import proxyRouter from '../../server/routes/proxy.js';

function getRouteHandler(router, method, path) {
    const layer = router.stack.find(s => s.route && s.route.path === path && s.route.methods[method.toLowerCase()]);
    if (!layer) throw new Error(`Route not found: ${method} ${path}`);
    return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockResponse() {
    const res = {
        statusCode: 200,
        headers: {},
        cookies: {},
        data: null,
        setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
        getHeader(k) { return this.headers[k.toLowerCase()]; },
        status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; },
        send(data) { this.data = data; return this; }
    };
    return res;
}

describe('Security Hardening & Anti-Phishing Unit Tests', () => {
    const embedHandler = getRouteHandler(proxyRouter, 'GET', '/embed');
    const assetHandler = getRouteHandler(proxyRouter, 'GET', '/asset');

    describe('Anti-SSRF & Whitelist Enforcement', () => {
        it('should block local loopback SSRF attempts on /embed', async () => {
            const forbiddenUrls = [
                'http://localhost:8080/admin',
                'http://127.0.0.1:5000/api',
                'http://0.0.0.0:3000',
                'http://169.254.169.254/latest/meta-data/',
                'http://192.168.1.1/router',
                'http://10.0.0.1/internal',
                'http://172.16.0.1/private'
            ];

            for (const target of forbiddenUrls) {
                const req = { query: { url: target }, headers: {} };
                const res = mockResponse();

                await embedHandler(req, res);
                assert.strictEqual(res.statusCode, 403, `Expected ${target} to be rejected with HTTP 403`);
                assert.ok(res.data?.error.includes('not allowed') || res.data?.error.includes('forbidden'));
            }
        });

        it('should reject unwhitelisted external hosts on /asset', async () => {
            const unwhitelistedUrl = 'https://malicious-phishing-host.com/script.js';
            const req = { query: { url: unwhitelistedUrl }, headers: {} };
            const res = mockResponse();

            await assetHandler(req, res);
            assert.strictEqual(res.statusCode, 403);
            assert.ok(res.data?.error.includes('forbidden') || res.data?.error.includes('not whitelisted'));
        });
    });
});

