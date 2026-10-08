export const STREAM_SERVERS = [
    {
        id: 'vidlink',
        name: 'VidLink HD',
        icon: 'fa-bolt',
        ping: '8ms',
        quality: '4K Ultra HDR',
        type: 'Primary Multi-Lang Node',
        isMultiLang: true,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&secondaryColor=b81d24&iconColor=ffffff&title=true&poster=true&autoplay=true`
                : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=b81d24&iconColor=ffffff&title=true&poster=true&autoplay=true`
    },
    {
        id: 'vidsrc_su',
        name: 'VidSrc SU',
        icon: 'fa-globe',
        ping: '10ms',
        quality: '4K Multi-Lang',
        type: 'Global Multi-Audio Node',
        isMultiLang: true,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.su/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.su/embed/movie/${id}`
    },
    {
        id: 'autoembed',
        name: 'AutoEmbed Club',
        icon: 'fa-shield-halved',
        ping: '12ms',
        quality: '1080p Multi-Sub',
        type: 'Multi-Language Backup Node',
        isMultiLang: true,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
                : `https://autoembed.co/movie/tmdb/${id}`
    },
    {
        id: '2embed',
        name: '2Embed Stream',
        icon: 'fa-language',
        ping: '14ms',
        quality: '1080p Multi-Sub',
        type: 'Multi-Subtitle Node',
        isMultiLang: true,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
                : `https://www.2embed.cc/embed/${id}`
    },
    {
        id: 'vidsrc_me',
        name: 'VidSrc Classic',
        icon: 'fa-play-circle',
        ping: '15ms',
        quality: '1080p Ultra',
        type: 'Ultra Fast Node',
        isMultiLang: false,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
                : `https://vidsrc.me/embed/movie?tmdb=${id}`
    },
    {
        id: 'vidsrc_pm',
        name: 'VidSrc PM',
        icon: 'fa-server',
        ping: '16ms',
        quality: '1080p HD',
        type: 'Cloud Edge Node',
        isMultiLang: false,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.pm/embed/movie/${id}`
    },
    {
        id: 'vidsrc_io',
        name: 'VidSrc IO',
        icon: 'fa-network-wired',
        ping: '18ms',
        quality: '1080p HD',
        type: 'Cloud Stream Node',
        isMultiLang: false,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.io/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.io/embed/movie/${id}`
    },
    {
        id: 'vidsrc_vip',
        name: 'VidSrc VIP',
        icon: 'fa-crown',
        ping: '20ms',
        quality: '1080p HD',
        type: 'VIP Direct Node',
        isMultiLang: false,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://vidsrc.vip/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.vip/embed/movie/${id}`
    },
    {
        id: 'videasy',
        name: 'Videasy HD',
        icon: 'fa-play',
        ping: '22ms',
        quality: '1080p Ultra',
        type: 'Fast Direct Node',
        isMultiLang: false,
        getUrl: (type, id, s = 1, e = 1) =>
            type === 'tv'
                ? `https://player.videasy.to/tv/${id}/${s}/${e}`
                : `https://player.videasy.to/movie/${id}`
    }
];

export const SPOOF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
};

export async function checkNodeHealth(server) {
    const url = server.getUrl('movie', '550', 1, 1);
    const start = Date.now();
    let status = 'UNKNOWN';
    let responseTime = 0;
    let statusCode = 0;

    try {
        const controller = new AbortController();
        // 2500ms timeout for accurate ping measurement
        const timeoutId = setTimeout(() => controller.abort(), 2500);

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

        const hasVideoContent = text.includes('iframe') || text.includes('video') || text.includes('player') || text.includes('embed') || text.includes('source') || text.includes('src=') || text.includes('hls') || text.includes('jwplayer');
        const isErrorPage = (text.toLowerCase().includes('error 404') || text.toLowerCase().includes('not found') || text.toLowerCase().includes('access denied')) && !hasVideoContent;
        const isHtml = contentType.includes('text/html');

        if (res.status >= 400) {
            status = 'FAILED';
        } else if ((isHtml || contentType.includes('text')) && hasVideoContent && !isErrorPage) {
            status = 'HEALTHY';
        } else if (res.status === 200) {
            status = 'HEALTHY';
        } else if (res.status >= 300 && res.status < 400) {
            status = 'HEALTHY';
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

// In-Memory Fast Health Cache (Instant <5ms response, non-blocking background refresh)
let memoryHealthCache = {
    nodes: STREAM_SERVERS.map(s => ({
        id: s.id,
        name: s.name,
        status: 'HEALTHY',
        statusCode: 200,
        responseTime: parseInt(s.ping) || 150,
        healthy: true
    })),
    summary: { total: STREAM_SERVERS.length, healthy: STREAM_SERVERS.length, failed: 0, avgResponseTime: 150 },
    timestamp: new Date().toISOString()
};

let isRefreshing = false;

export async function refreshHealthCacheBackground() {
    if (isRefreshing) return memoryHealthCache;
    isRefreshing = true;

    try {
        const results = await Promise.allSettled(
            STREAM_SERVERS.map(s => checkNodeHealth(s))
        );

        const nodes = results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return { id: STREAM_SERVERS[i].id, name: STREAM_SERVERS[i].name, status: 'FAILED', responseTime: 9999, healthy: false };
        });

        let healthyCount = 0;
        let totalTime = 0;
        nodes.forEach(n => {
            if (n.healthy) {
                healthyCount++;
                totalTime += n.responseTime;
            }
        });

        memoryHealthCache = {
            nodes,
            summary: {
                total: STREAM_SERVERS.length,
                healthy: healthyCount,
                failed: STREAM_SERVERS.length - healthyCount,
                avgResponseTime: healthyCount > 0 ? Math.round(totalTime / healthyCount) : 0
            },
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.warn('[NodeHealth]: Background refresh warning:', err.message);
    } finally {
        isRefreshing = false;
    }

    return memoryHealthCache;
}

// Returns warm health data instantly without blocking the HTTP request
export function getInstantHealthData() {
    // Trigger background refresh if stale (> 60 seconds)
    const age = Date.now() - new Date(memoryHealthCache.timestamp).getTime();
    if (age > 60000 && !isRefreshing) {
        refreshHealthCacheBackground().catch(() => {});
    }
    return memoryHealthCache;
}


