import 'dotenv/config';
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'cinepulse-test-jwt-secret-key-2026-xyz';
}
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import authRouter from '../../server/routes/auth.js';
import { requireAuth } from '../../server/middleware/requireAuth.js';

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
        status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; },
        cookie(name, val, opts) { this.cookies[name] = { val, opts }; return this; },
        clearCookie(name, opts) { delete this.cookies[name]; this.clearedCookie = { name, opts }; return this; }
    };
    return res;
}

describe('End-to-End Sign Up and Sign In Authentication Lifecycle Tests', () => {
    const registerHandler = getRouteHandler(authRouter, 'POST', '/register');
    const loginHandler = getRouteHandler(authRouter, 'POST', '/login');
    const logoutHandler = getRouteHandler(authRouter, 'POST', '/logout');
    const meHandler = getRouteHandler(authRouter, 'GET', '/me');

    const testId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const testUser = {
        username: `pilot_${testId}`,
        email: `pilot_${testId}@cinepulse.io`,
        password: 'CyberPilotPassword2026'
    };

    let sessionToken = null;

    it('Step 1: Sign Up / Register new account establishes session cookie and profile', async () => {
        const req = { body: testUser, ip: '127.0.0.1' };
        const res = mockResponse();

        await registerHandler(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.data?.success, true);
        assert.strictEqual(res.data?.user?.username, testUser.username);
        assert.strictEqual(res.data?.user?.email, testUser.email);
        assert.strictEqual(res.data?.user?.role, 'user');
        assert.ok(res.data?.user?.id);

        // HttpOnly session cookie must be set
        assert.ok(res.cookies.session);
        assert.ok(res.cookies.session.val);
        assert.strictEqual(res.cookies.session.opts.httpOnly, true);
        assert.strictEqual(res.cookies.session.opts.sameSite, 'lax');
        assert.strictEqual(res.cookies.session.opts.path, '/');

        sessionToken = res.cookies.session.val;
    });

    it('Step 2: Authenticated session profile retrieval via GET /api/auth/me', () => {
        assert.ok(sessionToken, 'Session token from Step 1 must exist');

        const req = {
            cookies: { session: sessionToken },
            headers: {}
        };
        const res = mockResponse();

        // Pass through requireAuth middleware
        let authPassed = false;
        requireAuth(req, res, () => { authPassed = true; });
        assert.strictEqual(authPassed, true);
        assert.ok(req.userId);

        // Call /me handler
        meHandler(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data?.user?.username, testUser.username);
        assert.strictEqual(res.data?.user?.email, testUser.email);
    });

    it('Step 3: Sign Out clears the session cookie', () => {
        const req = { cookies: { session: sessionToken } };
        const res = mockResponse();

        logoutHandler(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data?.success, true);
        assert.ok(res.clearedCookie);
        assert.strictEqual(res.clearedCookie.name, 'session');
        assert.strictEqual(res.clearedCookie.opts.httpOnly, true);
    });

    it('Step 4: Accessing protected endpoints after Sign Out returns 401 Unauthorized', () => {
        const req = { cookies: {}, headers: {} };
        const res = mockResponse();

        let authPassed = false;
        requireAuth(req, res, () => { authPassed = true; });

        assert.strictEqual(authPassed, false);
        assert.strictEqual(res.statusCode, 401);
        assert.deepStrictEqual(res.data, { error: 'Authentication required. Please log in.' });
    });

    it('Step 5: Sign In with username and password re-establishes session cookie', async () => {
        // Test signing in using username as identifier
        const reqUsername = { body: { identifier: testUser.username, password: testUser.password }, ip: '127.0.0.1' };
        const resUsername = mockResponse();
        await loginHandler(reqUsername, resUsername);

        assert.strictEqual(resUsername.statusCode, 200);
        assert.strictEqual(resUsername.data?.success, true);
        assert.strictEqual(resUsername.data?.user?.username, testUser.username);
        assert.ok(resUsername.cookies.session);
        assert.strictEqual(resUsername.cookies.session.opts.httpOnly, true);

        // Test signing in using email as identifier
        const reqEmail = { body: { identifier: testUser.email, password: testUser.password }, ip: '127.0.0.1' };
        const resEmail = mockResponse();
        await loginHandler(reqEmail, resEmail);

        assert.strictEqual(resEmail.statusCode, 200);
        assert.strictEqual(resEmail.data?.success, true);
        assert.strictEqual(resEmail.data?.user?.email, testUser.email);
        assert.ok(resEmail.cookies.session);
    });

    it('Step 6: Sign In with incorrect password fails with 401 and sets no cookie', async () => {
        const req = { body: { identifier: testUser.email, password: 'WrongPassword999' }, ip: '127.0.0.1' };
        const res = mockResponse();

        await loginHandler(req, res);

        assert.strictEqual(res.statusCode, 401);
        assert.deepStrictEqual(res.data, { error: 'Invalid credentials. Please check your details and try again.' });
        assert.strictEqual(res.cookies.session, undefined);
    });
});
