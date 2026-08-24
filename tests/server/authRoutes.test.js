import 'dotenv/config';
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'cinepulse-test-jwt-secret-key-2026-xyz';
}
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import authRouter from '../../server/routes/auth.js';

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

describe('Cookie-Based Authentication Route Handlers Unit Tests', () => {
    const registerHandler = getRouteHandler(authRouter, 'POST', '/register');
    const loginHandler = getRouteHandler(authRouter, 'POST', '/login');
    const logoutHandler = getRouteHandler(authRouter, 'POST', '/logout');
    const meHandler = getRouteHandler(authRouter, 'GET', '/me');

    describe('POST /api/auth/register', () => {
        it('should reject invalid or short username', async () => {
            const req = { body: { username: 'ab', email: 'test@valid.com', password: 'Password123' } };
            const res = mockResponse();

            await registerHandler(req, res);
            assert.strictEqual(res.statusCode, 400);
            assert.ok(res.data?.error.includes('Username'));
        });

        it('should reject invalid email format', async () => {
            const req = { body: { username: 'validuser', email: 'not-an-email', password: 'Password123' } };
            const res = mockResponse();

            await registerHandler(req, res);
            assert.strictEqual(res.statusCode, 400);
            assert.ok(res.data?.error.includes('email'));
        });

        it('should reject password without numbers or shorter than 8 chars', async () => {
            const reqShort = { body: { username: 'validuser', email: 'user@test.com', password: 'abc' } };
            const resShort = mockResponse();
            await registerHandler(reqShort, resShort);
            assert.strictEqual(resShort.statusCode, 400);

            const reqNoNum = { body: { username: 'validuser', email: 'user@test.com', password: 'passwordwithoutnumber' } };
            const resNoNum = mockResponse();
            await registerHandler(reqNoNum, resNoNum);
            assert.strictEqual(resNoNum.statusCode, 400);
        });

        it('should register valid user, set HttpOnly session cookie, and NOT return JWT in body', async () => {
            const unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
            const req = {
                body: {
                    username: `user_${unique}`,
                    email: `user_${unique}@cinepulse.test`,
                    password: 'SecurePassword123'
                }
            };
            const res = mockResponse();

            await registerHandler(req, res);
            assert.strictEqual(res.statusCode, 201);
            assert.strictEqual(res.data?.success, true);
            assert.strictEqual(res.data?.user?.email, `user_${unique}@cinepulse.test`);
            // CRITICAL: JWT MUST NOT be returned in JSON response body
            assert.strictEqual(res.data?.token, undefined);

            // Verify HttpOnly session cookie
            assert.ok(res.cookies.session);
            assert.ok(res.cookies.session.val);
            assert.strictEqual(res.cookies.session.opts.httpOnly, true);
            assert.strictEqual(res.cookies.session.opts.sameSite, 'lax');
            assert.strictEqual(res.cookies.session.opts.path, '/');

            // Verify CSRF cookie
            assert.ok(res.cookies.csrf_token);
            assert.strictEqual(res.cookies.csrf_token.opts.httpOnly, false);
        });

        it('should reject duplicate email or username registration with 409 conflict', async () => {
            const unique = Date.now().toString(36) + '_dup';
            const req1 = {
                body: {
                    username: `user_${unique}`,
                    email: `user_${unique}@cinepulse.test`,
                    password: 'SecurePassword123'
                }
            };
            const res1 = mockResponse();
            await registerHandler(req1, res1);
            assert.strictEqual(res1.statusCode, 201);

            // Repeat with duplicate email
            const req2 = {
                body: {
                    username: `different_${unique}`,
                    email: `user_${unique}@cinepulse.test`,
                    password: 'SecurePassword123'
                }
            };
            const res2 = mockResponse();
            await registerHandler(req2, res2);
            assert.strictEqual(res2.statusCode, 409);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should log in existing user, set HttpOnly session cookie, and NOT return JWT in body', async () => {
            const unique = Date.now().toString(36) + '_login';
            const email = `login_${unique}@cinepulse.test`;
            const username = `login_${unique}`;
            const password = 'CorrectPassword99';

            // Register first
            const regReq = { body: { username, email, password } };
            const regRes = mockResponse();
            await registerHandler(regReq, regRes);

            // Login
            const loginReq = { body: { identifier: email, password } };
            const loginRes = mockResponse();
            await loginHandler(loginReq, loginRes);

            assert.strictEqual(loginRes.statusCode, 200);
            assert.strictEqual(loginRes.data?.success, true);
            assert.strictEqual(loginRes.data?.user?.username, username);
            // CRITICAL: JWT MUST NOT be returned in JSON response body
            assert.strictEqual(loginRes.data?.token, undefined);

            // Verify HttpOnly session cookie
            assert.ok(loginRes.cookies.session);
            assert.ok(loginRes.cookies.session.val);
            assert.strictEqual(loginRes.cookies.session.opts.httpOnly, true);
            assert.strictEqual(loginRes.cookies.session.opts.sameSite, 'lax');
            assert.strictEqual(loginRes.cookies.session.opts.path, '/');
        });

        it('should reject login with wrong password and generic error', async () => {
            const unique = Date.now().toString(36) + '_wrongpass';
            const email = `login_${unique}@cinepulse.test`;
            const username = `login_${unique}`;

            const regReq = { body: { username, email, password: 'RealPassword123' } };
            const regRes = mockResponse();
            await registerHandler(regReq, regRes);

            const loginReq = { body: { identifier: email, password: 'WrongPassword999' } };
            const loginRes = mockResponse();
            await loginHandler(loginReq, loginRes);

            assert.strictEqual(loginRes.statusCode, 401);
            assert.deepStrictEqual(loginRes.data, { error: 'Invalid credentials. Please check your details and try again.' });
            assert.strictEqual(loginRes.cookies.session, undefined);
        });

        it('should reject non-existent user with generic error to prevent account enumeration', async () => {
            const loginReq = { body: { identifier: 'nonexistent_ghost_999@cinepulse.test', password: 'AnyPassword123' } };
            const loginRes = mockResponse();
            await loginHandler(loginReq, loginRes);

            assert.strictEqual(loginRes.statusCode, 401);
            assert.deepStrictEqual(loginRes.data, { error: 'Invalid credentials. Please check your details and try again.' });
            assert.strictEqual(loginRes.cookies.session, undefined);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should clear session cookie with path=/ and sameSite=lax', () => {
            const req = {};
            const res = mockResponse();
            logoutHandler(req, res);

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.data?.success, true);
            assert.ok(res.clearedCookie);
            assert.strictEqual(res.clearedCookie.name, 'session');
            assert.strictEqual(res.clearedCookie.opts.httpOnly, true);
            assert.strictEqual(res.clearedCookie.opts.sameSite, 'lax');
            assert.strictEqual(res.clearedCookie.opts.path, '/');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should fetch user profile for authenticated user ID derived from cookie', async () => {
            const unique = Date.now().toString(36) + '_me';
            const email = `me_${unique}@cinepulse.test`;
            const username = `me_${unique}`;

            const regReq = { body: { username, email, password: 'PasswordMe123' } };
            const regRes = mockResponse();
            await registerHandler(regReq, regRes);
            const userId = regRes.data.user.id;

            const meReq = { userId };
            const meRes = mockResponse();
            meHandler(meReq, meRes);

            assert.strictEqual(meRes.statusCode, 200);
            assert.ok(meRes.data?.user);
            assert.strictEqual(meRes.data?.user?.username, username);
            assert.strictEqual(meRes.data?.user?.email, email);
        });
    });
});
