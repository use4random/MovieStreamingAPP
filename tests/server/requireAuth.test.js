import 'dotenv/config';
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'cinepulse-test-jwt-secret-key-2026-xyz';
}
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireAuth, optionalAuth } from '../../server/middleware/requireAuth.js';

const TEST_SECRET = process.env.JWT_SECRET;

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

describe('Cookie-Only Authentication Middleware Unit Tests', () => {
    describe('requireAuth()', () => {
        it('should return 401 when no session cookie is present', () => {
            const req = { headers: {}, cookies: {} };
            const res = mockResponse();
            let nextCalled = false;

            requireAuth(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, false);
            assert.strictEqual(res.statusCode, 401);
            assert.deepStrictEqual(res.data, { error: 'Authentication required. Please log in.' });
        });

        it('should return 401 when session cookie contains invalid or malformed token', () => {
            const req = { headers: {}, cookies: { session: 'invalid.malformed.jwt' } };
            const res = mockResponse();
            let nextCalled = false;

            requireAuth(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, false);
            assert.strictEqual(res.statusCode, 401);
            assert.ok(res.data?.error);
        });

        it('should return 401 even if Authorization header is sent without session cookie', () => {
            const userPayload = { sub: 'usr_header_only', role: 'user' };
            const token = jwt.sign(userPayload, TEST_SECRET, { expiresIn: '1h' });

            const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
            const res = mockResponse();
            let nextCalled = false;

            requireAuth(req, res, () => { nextCalled = true; });

            // Must reject because session cookie is mandatory for browser auth
            assert.strictEqual(nextCalled, false);
            assert.strictEqual(res.statusCode, 401);
        });

        it('should pass and set req.userId and req.user for valid HttpOnly session cookie', () => {
            const userPayload = { sub: 'usr_cookie_123', role: 'user' };
            const token = jwt.sign(userPayload, TEST_SECRET, { expiresIn: '1h' });

            const req = { headers: {}, cookies: { session: token } };
            const res = mockResponse();
            let nextCalled = false;

            requireAuth(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(req.userId, 'usr_cookie_123');
            assert.strictEqual(req.user.sub, 'usr_cookie_123');
            assert.strictEqual(req.user.role, 'user');
        });
    });

    describe('optionalAuth()', () => {
        it('should default to guest when no session cookie is provided', () => {
            const req = { headers: {}, cookies: {}, query: {} };
            const res = mockResponse();
            let nextCalled = false;

            optionalAuth(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(req.userId, 'guest');
        });

        it('should attach authenticated user if valid session cookie exists', () => {
            const userPayload = { sub: 'usr_optional_777', role: 'vip' };
            const token = jwt.sign(userPayload, TEST_SECRET, { expiresIn: '1h' });

            const req = { headers: {}, cookies: { session: token }, query: {} };
            const res = mockResponse();
            let nextCalled = false;

            optionalAuth(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(req.userId, 'usr_optional_777');
            assert.strictEqual(req.user.sub, 'usr_optional_777');
        });

        it('should safely fall back to guest if session cookie is invalid', () => {
            const req = { headers: {}, cookies: { session: 'tampered.token' }, query: {} };
            const res = mockResponse();
            let nextCalled = false;

            optionalAuth(req, res, () => { nextCalled = true; });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(req.userId, 'guest');
        });
    });
});
