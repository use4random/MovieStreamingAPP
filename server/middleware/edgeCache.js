/**
 * Edge CDN Caching Middleware
 * Sets HTTP Cache-Control headers for Edge CDN revalidation (Vercel Edge, Cloudflare, Fastly).
 * 
 * @param {number} maxAgeSeconds Duration Edge CDN caches response (default: 300s / 5 mins)
 * @param {number} staleWhileRevalidateDuration Background revalidation buffer (default: 600s / 10 mins)
 */
export function edgeCache(maxAgeSeconds = 300, staleWhileRevalidateDuration = 600) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method === 'GET') {
            res.setHeader(
                'Cache-Control',
                `public, max-age=60, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateDuration}`
            );
        }
        next();
    };
}
