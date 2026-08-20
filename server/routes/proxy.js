import express from 'express';
import { Readable } from 'node:stream';

const router = express.Router();

// Headers that block iframe embedding — strip them all
const BLOCKED_HEADERS = [
    'x-frame-options',
    'content-security-policy',
    'content-security-policy-report-only',
    'cross-origin-embedder-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
    'x-content-type-options',
];

// Spoof a real browser request so embed providers don't 403 us
const SPOOF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
};

/**
 * Known mobile ad network host patterns to strip from proxied embed HTML
 */
const AD_SCRIPT_PATTERNS = [
    /https?:\/\/[^"'\s>]*adsterra[^"'\s>]*/gi,
    /https?:\/\/[^"'\s>]*exoclick[^"'\s>]*/gi,
    /https?:\/\/[^"'\s>]*hilltopads[^"'\s>]*/gi,
    /https?:\/\/[^"'\s>]*propellerads[^"'\s>]*/gi,
    /https?:\/\/[^"'\s>]*popads[^"'\s>]*/gi,
    /https?:\/\/[^"'\s>]*popcash[^"'\s>]*/gi,
    /https?:\/\/[^"'\s>]*clickadu[^"'\s>]*/gi,
];

/**
 * Rewrite relative URLs inside HTML and inject strict Anti-Popup defense script.
 */
function rewriteUrls(html, baseUrl) {
    const base = new URL(baseUrl);
    const origin = base.origin;

    const antiPopupScript = `
    <script>
    (function() {
        var noop = function() {};
        var dummyWin = { focus: noop, blur: noop, close: noop, postMessage: noop, location: { href: '' } };
        window.open = function() {
            console.warn('[Proxy Shield] Intercepted window.open inside iframe');
            return dummyWin;
        };
        window.showModalDialog = function() { return null; };
        try {
            Object.defineProperty(window, 'top', { get: function() { return window.self; } });
            Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
        } catch(e) {}
        if (typeof HTMLAnchorElement !== 'undefined') {
            var origClick = HTMLAnchorElement.prototype.click;
            HTMLAnchorElement.prototype.click = function() {
                var href = this.getAttribute('href') || this.href || '';
                if (this.target === '_blank' || (typeof href === 'string' && href.indexOf('http') === 0 && href.indexOf(window.location.origin) !== 0)) {
                    console.warn('[Proxy Shield] Intercepted dynamic anchor click inside iframe:', href);
                    return;
                }
                return origClick.apply(this, arguments);
            };
        }
    })();
    </script>
    `;

    // Strip known ad network scripts
    let sanitizedHtml = html;
    AD_SCRIPT_PATTERNS.forEach(pattern => {
        sanitizedHtml = sanitizedHtml.replace(pattern, '');
    });

    // Inject base tag and anti-popup defense script into <head>
    return sanitizedHtml.replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">${antiPopupScript}`);
}

// Whitelisted embed and sub-resource hosts
const ALLOWED_HOSTS = [
    'vidlink.pro',
    'nxshatv.cfd',
    'nxsha.com',
    'embed.nxsha.com',
    'player.videasy.net',
    'player.videasy.to',
    'videasy.to',
    'vidsrc.sbs',
    'autoembed.co',
    'vidsrc.io',
    'vidsrc.pm',
    'vidsrc.me',
    'vidsrcme.ru',
    '2embed.cc',
    '2embed.stream',
    'vidbinge.dev',
    'vidsrc.pro',
    'vidsrc.xyz',
    'embed.su',
    'smashystream.com',
    'vid2fcdn.xyz',
    'player.smashy.stream',
    'moviesapi.club',
];

/**
 * Check if target hostname is a loopback, cloud metadata, or private IP address (SSRF Protection)
 */
function isPrivateOrLoopbackHost(hostname) {
    if (!hostname) return true;
    const lower = hostname.toLowerCase().trim();

    if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower.endsWith('.local') || lower.endsWith('.internal')) {
        return true;
    }
    // Block Cloud metadata (AWS, GCP, Azure) at 169.254.169.254
    if (lower === '169.254.169.254' || lower.startsWith('169.254.')) {
        return true;
    }
    // Block RFC 1918 Private Subnets: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (/^10\./.test(lower) || /^192\.168\./.test(lower) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)) {
        return true;
    }
    return false;
}

/**
 * Validates if the target URL is safe to fetch (non-private & in ALLOWED_HOSTS whitelist)
 */
function isAllowedUrl(targetUrl) {
    if (!targetUrl || !targetUrl.hostname) return false;
    if (isPrivateOrLoopbackHost(targetUrl.hostname)) return false;
    return ALLOWED_HOSTS.some(host =>
        targetUrl.hostname === host || targetUrl.hostname.endsWith('.' + host)
    );
}

/**
 * GET /api/proxy/embed?url=<encoded embed URL>
 *
 * Fetches the embed page server-side, strips restrictive headers, and
 * pipes the content back — making it embeddable in an iframe securely.
 */
router.get('/embed', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    let targetUrl;
    try {
        targetUrl = new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL provided' });
    }

    if (!isAllowedUrl(targetUrl)) {
        return res.status(403).json({ error: 'Requested host is not allowed.' });
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            headers: {
                ...SPOOF_HEADERS,
                'Referer': `${targetUrl.origin}/`,
                'Origin': targetUrl.origin,
            },
            redirect: 'follow',
        });

        // SSRF check on final redirected URL
        let finalUrl;
        try {
            finalUrl = new URL(response.url);
        } catch {
            finalUrl = targetUrl;
        }

        if (isPrivateOrLoopbackHost(finalUrl.hostname)) {
            return res.status(403).json({ error: 'Redirected host is forbidden.' });
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Upstream provider returned HTTP ${response.status}`,
            });
        }

        const contentType = finalResponse.headers.get('content-type') || 'text/html';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');

        if (contentType.includes('text/html')) {
            let html = await finalResponse.text();
            html = rewriteUrls(html, targetUrl.toString());
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            return res.send(html);
        }

        // Stream binary non-HTML payload directly to res without buffering in RAM
        if (finalResponse.body && typeof Readable.fromWeb === 'function') {
            return Readable.fromWeb(finalResponse.body).pipe(res);
        }
        const buffer = await finalResponse.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (err) {
        console.error('[Proxy /embed Error]:', err.message);
        return res.status(502).json({
            error: 'Upstream stream connection failed.',
        });
    }
});

/**
 * GET /api/proxy/asset?url=<encoded asset URL>
 *
 * Secure proxy for sub-resources (scripts, CSS, images) loaded by the embed page.
 * Strictly checks host whitelist and blocks private/loopback IP requests.
 * Uses native stream piping for low-memory throughput.
 */
router.get('/asset', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing ?url= parameter' });

    let targetUrl;
    try {
        targetUrl = new URL(decodeURIComponent(url));
    } catch {
        return res.status(400).json({ error: 'Invalid asset URL' });
    }

    if (!isAllowedUrl(targetUrl)) {
        return res.status(403).json({ error: 'Asset host forbidden or not whitelisted.' });
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            headers: SPOOF_HEADERS,
            redirect: 'follow',
        });

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (response.body && typeof Readable.fromWeb === 'function') {
            return Readable.fromWeb(response.body).pipe(res);
        }
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('[Proxy /asset Error]:', err.message);
        res.status(502).json({ error: 'Asset fetch failed.' });
    }
});

export default router;
