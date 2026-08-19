import express from 'express';
import NodeCache from 'node-cache';

const router = express.Router();
// 2 minute cache for server health checks to maintain ultra-fast UI load
const healthCache = new NodeCache({ stdTTL: 120, checkperiod: 60 });

const STREAM_SERVERS = [
    {
        id: 'vidlink',
        name: 'VidLink HD',
        icon: 'fa-bolt',
        ping: '8ms',
        quality: '4K HDR',
        type: 'Primary Node (Fastest)',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&secondaryColor=b81d24&iconColor=ffffff&title=true&poster=true&autoplay=true`
                : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=b81d24&iconColor=ffffff&title=true&poster=true&autoplay=true`
    },
    {
        id: 'vidsrc_me',
        name: 'VidSrc Classic',
        icon: 'fa-play-circle',
        ping: '10ms',
        quality: '1080p Ultra',
        type: 'Fast Ultra Node',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
                : `https://vidsrc.me/embed/movie?tmdb=${id}`
    },
    {
        id: 'vidsrc_sbs',
        name: 'VidSrc SBS (Ultra)',
        icon: 'fa-film',
        ping: '12ms',
        quality: '4K IMAX',
        type: 'SBS Multi-Node',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}/`
                : `https://vidsrc.sbs/embed/movie/${id}/`
    },
    {
        id: 'autoembed',
        name: 'AutoEmbed Club',
        icon: 'fa-shield-halved',
        ping: '14ms',
        quality: '1080p 60FPS',
        type: 'High-Speed Backup',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
                : `https://autoembed.co/movie/tmdb/${id}`
    },
    {
        id: '2embed_stream',
        name: '2Embed Stream',
        icon: 'fa-compact-disc',
        ping: '16ms',
        quality: '1080p',
        type: 'Global CDN Node',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://www.2embed.stream/embed/tv/${id}/${s}/${e}`
                : `https://www.2embed.stream/embed/movie/${id}`
    },
    {
        id: 'vidsrc_pm',
        name: 'VidSrc PM',
        icon: 'fa-server',
        ping: '18ms',
        quality: '1080p HD',
        type: 'Cloud Edge Node',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.pm/embed/movie/${id}`
    },
    {
        id: 'vidsrc_io',
        name: 'VidSrc IO',
        icon: 'fa-network-wired',
        ping: '20ms',
        quality: '1080p HD',
        type: 'Cloud Stream Node',
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.io/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.io/embed/movie/${id}`
    }
];

const SPOOF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
};

async function checkNodeHealth(server) {
    const url = server.getUrl('movie', '550', 1, 1);
    const start = Date.now();
    let status = 'UNKNOWN';
    let responseTime = 0;
    let statusCode = 0;

    try {
        const controller = new AbortController();
        // Aggressive timeout of 1800ms to instantly prune slow or laggy nodes
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const res = await fetch(url, {
            method: 'GET',
            headers: SPOOF_HEADERS,
            signal: controller.signal,
            redirect: 'follow'
        });

        clearTimeout(timeoutId);
        responseTime = Date.now() - start;
        statusCode = res.status;

        const buffer = await res.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8').slice(0, 3000);
        const contentType = res.headers.get('content-type') || '';

        const hasVideoContent = text.includes('iframe') || text.includes('video') || text.includes('player') || text.includes('embed') || text.includes('source') || text.includes('stream') || text.includes('src=') || text.includes('hls') || text.includes('jwplayer');
        const isErrorPage = (text.toLowerCase().includes('error 404') || text.toLowerCase().includes('not found') || text.toLowerCase().includes('access denied')) && !hasVideoContent;
        const isHtml = contentType.includes('text/html');

        if (res.status >= 400) {
            status = 'FAILED';
        } else if ((isHtml || contentType.includes('text')) && hasVideoContent && !isErrorPage) {
            status = 'HEALTHY';
        } else if (res.status === 200) {
            status = 'HEALTHY';
        } else if (res.status >= 300 && res.status < 400) {
            status = 'REDIRECT';
        } else {
            status = 'PARTIAL';
        }
    } catch (err) {
        responseTime = Date.now() - start;
        if (err.name === 'AbortError') {
            status = 'TIMEOUT';
        } else {
            status = 'FAILED';
        }
    }

    return {
        id: server.id,
        name: server.name,
        status,
        statusCode,
        responseTime,
        declaredPing: `${responseTime ? Math.min(responseTime, 999) : '999'}ms`,
        healthy: status === 'HEALTHY'
    };
}

router.get('/health', async (req, res) => {
    const cacheKey = 'server-health';
    const cached = healthCache.get(cacheKey);

    if (cached) {
        return res.json({ ...cached, cached: true, timestamp: new Date().toISOString() });
    }

    // Run parallel health checks on all streaming nodes
    const results = await Promise.allSettled(
        STREAM_SERVERS.map(server => checkNodeHealth(server))
    );

    const healthData = {
        nodes: results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return { id: STREAM_SERVERS[i].id, name: STREAM_SERVERS[i].name, status: 'ERROR', responseTime: 9999, healthy: false };
        }),
        summary: {
            total: STREAM_SERVERS.length,
            healthy: 0,
            failed: 0,
            avgResponseTime: 0
        },
        timestamp: new Date().toISOString()
    };

    let totalResponseTime = 0;
    let healthyCount = 0;

    healthData.nodes.forEach(node => {
        if (node.healthy) {
            healthData.summary.healthy++;
            totalResponseTime += node.responseTime || 0;
            healthyCount++;
        } else {
            healthData.summary.failed++;
        }
    });

    healthData.summary.avgResponseTime = healthyCount > 0 ? Math.round(totalResponseTime / healthyCount) : 0;

    // Filter and sort active pool by response time (fastest functional node first)
    healthData.nodes.sort((a, b) => {
        if (a.healthy && !b.healthy) return -1;
        if (!a.healthy && b.healthy) return 1;
        return (a.responseTime || 9999) - (b.responseTime || 9999);
    });

    healthCache.set(cacheKey, healthData);
    res.json(healthData);
});

router.get('/', async (req, res) => {
    const { type = 'movie', id, season = 1, episode = 1 } = req.query;

    // Retrieve health data if available or run fast check
    let healthData = healthCache.get('server-health');
    if (!healthData) {
        const results = await Promise.allSettled(STREAM_SERVERS.map(s => checkNodeHealth(s)));
        const nodes = results.map((r, i) => r.status === 'fulfilled' ? r.value : { id: STREAM_SERVERS[i].id, healthy: false, responseTime: 9999 });
        healthCache.set('server-health', { nodes });
        healthData = { nodes };
    }

    // Map servers and attach real dynamic ping & health filtering
    let servers = STREAM_SERVERS.map(s => {
        const h = healthData.nodes?.find(n => n.id === s.id);
        return {
            id: s.id,
            name: s.name,
            icon: s.icon,
            ping: h?.healthy ? `${h.responseTime}ms` : s.ping,
            quality: s.quality,
            type: s.type,
            healthy: h ? h.healthy : true,
            responseTime: h ? h.responseTime : 999,
            url: id ? s.getUrl(type, id, season, episode) : null
        };
    });

    // Remove permanently failing or unresponsive nodes from active pool, sort by performance
    servers = servers.filter(s => s.healthy !== false);
    servers.sort((a, b) => (a.responseTime || 999) - (b.responseTime || 999));

    res.json(servers);
});

export default router;


