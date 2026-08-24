import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { csrfProtection, generateCsrfToken, setCsrfCookie } from '../../server/middleware/csrf.js';

function mockResponse() {
    const res = {
        statusCode: 200,
        headers: {},
        cookies: {},
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; },
        cookie(name, val, opts) { this.cookies[name] = { val, opts }; return this; }
    };
    return res;
}

describe('Double-Submit Cookie CSRF Protection Unit Tests', () => {
    describe('GET & Safe Requests', () => {
        it('should automatically generate and set csrf_token cookie on GET request if not present', () => {
            const req = { method: 'GET', cookies: {}, headers: {} };
            const res = mockResponse();
            let nextCalled = false;

            csrfProtection(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.ok(res.cookies.csrf_token);
            assert.ok(res.cookies.csrf_token.val);
            assert.strictEqual(res.cookies.csrf_token.opts.httpOnly, false); // Accessible to JavaScript
            assert.strictEqual(res.cookies.csrf_token.opts.sameSite, 'lax');
            assert.strictEqual(res.cookies.csrf_token.opts.path, '/');
        });

        it('should not overwrite existing csrf_token cookie on GET request', () => {
            const req = { method: 'GET', cookies: { csrf_token: 'existing_token_123' }, headers: {} };
            const res = mockResponse();
            let nextCalled = false;

            csrfProtection(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(res.cookies.csrf_token, undefined); // No new cookie set
        });
    });

    describe('State-Changing Requests (POST, PUT, DELETE)', () => {
        it('should allow mutating request when X-CSRF-Token matches csrf_token cookie', () => {
            const token = generateCsrfToken();
            const req = {
                method: 'POST',
                url: '/api/user/watchlist',
                cookies: { csrf_token: token },
                headers: { 'x-csrf-token': token }
            };
            const res = mockResponse();
            let nextCalled = false;

            csrfProtection(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(res.statusCode, 200);
        });

        it('should reject mutating request with HTTP 403 when X-CSRF-Token header is missing', () => {
            const token = generateCsrfToken();
            const req = {
                method: 'POST',
                url: '/api/user/watchlist',
                cookies: { csrf_token: token },
                headers: {}
            };
            const res = mockResponse();
            let nextCalled = false;

            csrfProtection(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, false);
            assert.strictEqual(res.statusCode, 403);
            assert.deepStrictEqual(res.data, { error: 'Invalid or missing CSRF token' });
        });

        it('should reject mutating request with HTTP 403 when X-CSRF-Token does not match cookie', () => {
            const req = {
                method: 'DELETE',
                url: '/api/user/watchlist',
                cookies: { csrf_token: 'valid_cookie_token' },
                headers: { 'x-csrf-token': 'attacker_mismatched_token' }
            };
            const res = mockResponse();
            let nextCalled = false;

            csrfProtection(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, false);
            assert.strictEqual(res.statusCode, 403);
            assert.deepStrictEqual(res.data, { error: 'Invalid or missing CSRF token' });
        });

        it('should allow exempt authentication routes like /api/auth/login and /api/auth/register without CSRF token', () => {
            const reqLogin = {
                method: 'POST',
                url: '/api/auth/login',
                cookies: {},
                headers: {}
            };
            const resLogin = mockResponse();
            let loginNext = false;
            csrfProtection(reqLogin, resLogin, () => { loginNext = true; });
            assert.strictEqual(loginNext, true);

            const reqRegister = {
                method: 'POST',
                url: '/api/auth/register',
                cookies: {},
                headers: {}
            };
            const resRegister = mockResponse();
            let registerNext = false;
            csrfProtection(reqRegister, resRegister, () => { registerNext = true; });
            assert.strictEqual(registerNext, true);
        });
    });
});
