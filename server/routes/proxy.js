import express from 'express';

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
 * Rewrite relative URLs inside HTML to absolute so sub-resources
 * (scripts, css, images, iframes) from the embed provider load correctly.
 */
function rewriteUrls(html, baseUrl) {
    const base = new URL(baseUrl);
    const origin = base.origin;

    // Inject a <base> tag right after <head> so all relative paths resolve
    return html.replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">`);
}

/**
 * GET /api/proxy/embed?url=<encoded embed URL>
 *
 * Fetches the embed page server-side, strips restrictive headers, and
 * pipes the content back — making it embeddable in an iframe on localhost.
 */
router.get('/embed', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    // Basic URL validation
    let targetUrl;
    try {
        targetUrl = new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // Only allow known embed providers for security
    const ALLOWED_HOSTS = [
        'vidlink.pro',
        'vidsrc.me',
        'vidsrc.sbs',
        'autoembed.co',
        '2embed.stream',
        '2embed.cc',
        'vidsrc.pm',
        'vidsrc.io',
        'vidsrc.pro',
        'vidsrc.icu',
        'vidsrc.xyz',
        'vidsrc.to',
        'embed.su',
        'smashystream.com',
        'player.videasy.net',
        'vid2fcdn.xyz',
        'player.smashy.stream',
        'moviesapi.club',
    ];


    const isAllowed = ALLOWED_HOSTS.some(host =>
        targetUrl.hostname === host || targetUrl.hostname.endsWith('.' + host)
    );

    if (!isAllowed) {
        return res.status(403).json({
            error: `Host "${targetUrl.hostname}" is not in the allowed embed provider list.`
        });
    }

    try {
        // Fetch with a spoofed Referer matching the provider's own domain
        const response = await fetch(targetUrl.toString(), {
            headers: {
                ...SPOOF_HEADERS,
                'Referer': `${targetUrl.origin}/`,
                'Origin': targetUrl.origin,
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Upstream returned HTTP ${response.status}`,
            });
        }

        const contentType = response.headers.get('content-type') || 'text/html';

        // Forward safe headers to client
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');

        // If it's HTML, strip blocked headers and rewrite relative URLs
        if (contentType.includes('text/html')) {
            let html = await response.text();
            html = rewriteUrls(html, targetUrl.toString());
            // Explicitly allow our own iframe to embed this response
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            return res.send(html);
        }

        // For non-HTML (JS, CSS) just stream without the blocked headers
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (err) {
        console.error('[Proxy] Fetch error:', err.message);
        return res.status(502).json({
            error: 'Proxy fetch failed: ' + err.message,
        });
    }
});

/**
 * GET /api/proxy/asset?url=<encoded asset URL>
 *
 * Proxy for sub-resources (scripts, CSS, images) loaded by the embed page
 * that themselves may have CORS restrictions.
 */
router.get('/asset', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).end();

    try {
        const response = await fetch(decodeURIComponent(url), {
            headers: SPOOF_HEADERS,
            redirect: 'follow',
        });

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err) {
        res.status(502).end();
    }
});

export default router;
