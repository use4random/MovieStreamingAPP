import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, authLimiter } from '../../server/middleware/rateLimiter.js';

function mockResponse() {
    const res = {
        statusCode: 200,
        headers: {},
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
        setHeader(k, v) {
            this.headers[k] = v;
            return this;
        }
    };
    return res;
}

describe('Rate Limiter Middleware Unit Tests', () => {
    it('should allow requests within configured threshold', () => {
        const limiter = createRateLimiter({
            name: 'test_limit_1',
            windowMs: 5000,
            max: 5
        });

        const req = { ip: '127.0.0.1', headers: {} };
        const res = mockResponse();

        let passCount = 0;
        for (let i = 0; i < 5; i++) {
            limiter(req, res, () => { passCount++; });
        }

        assert.strictEqual(passCount, 5);
        assert.strictEqual(res.statusCode, 200);
    });

    it('should block requests exceeding the threshold with HTTP 429', () => {
        const limiter = createRateLimiter({
            name: 'test_limit_2',
            windowMs: 5000,
            max: 3,
            message: { error: 'Rate limit hit' }
        });

        const req = { ip: '192.168.1.100', headers: {} };
        let passCount = 0;

        for (let i = 0; i < 3; i++) {
            const res = mockResponse();
            limiter(req, res, () => { passCount++; });
        }
        assert.strictEqual(passCount, 3);

        // 4th request exceeds max
        const blockedRes = mockResponse();
        let fourthPassed = false;
        limiter(req, blockedRes, () => { fourthPassed = true; });

        assert.strictEqual(fourthPassed, false);
        assert.strictEqual(blockedRes.statusCode, 429);
        assert.deepStrictEqual(blockedRes.data, { error: 'Rate limit hit' });
        assert.ok(blockedRes.headers['Retry-After']);
    });

    it('should provide 3x capacity boost for authenticated or identified clients', () => {
        const limiter = createRateLimiter({
            name: 'test_limit_auth',
            windowMs: 5000,
            max: 2 // auth limit becomes 2 * 3 = 6
        });

        const req = { ip: '10.0.0.5', headers: { authorization: 'Bearer token123' } };
        let passCount = 0;

        for (let i = 0; i < 6; i++) {
            const res = mockResponse();
            limiter(req, res, () => { passCount++; });
        }
        assert.strictEqual(passCount, 6);

        // 7th request exceeds 6
        const blockedRes = mockResponse();
        let seventhPassed = false;
        limiter(req, blockedRes, () => { seventhPassed = true; });

        assert.strictEqual(seventhPassed, false);
        assert.strictEqual(blockedRes.statusCode, 429);
    });
});
