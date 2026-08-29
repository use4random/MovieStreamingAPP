import express from 'express';
import { cache } from '../utils/cache.js';
import { STREAM_SERVERS, checkNodeHealth } from '../utils/nodeHealth.js';

const router = express.Router();

const SPOOF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
};

router.get('/health', async (req, res) => {
    const cacheKey = 'server-health';
    const cached = await cache.get(cacheKey);

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

    await cache.set(cacheKey, healthData, 120);
    res.json(healthData);
});

router.get('/', async (req, res) => {
    const { type = 'movie', id, imdb, season = 1, episode = 1 } = req.query;

    // Retrieve health data if available or run fast check
    let healthData = await cache.get('server-health');
    if (!healthData) {
        const results = await Promise.allSettled(STREAM_SERVERS.map(s => checkNodeHealth(s)));
        const nodes = results.map((r, i) => r.status === 'fulfilled' ? r.value : { id: STREAM_SERVERS[i].id, healthy: false, responseTime: 9999 });
        healthData = { nodes };
        await cache.set('server-health', healthData, 120);
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
            url: id ? s.getUrl(type, id, season, episode, imdb) : null
        };
    });

    // Order functional nodes by speed and reliability (fastest healthy node first)
    servers = servers.filter(s => s.healthy !== false);
    servers.sort((a, b) => {
        if (a.id === 'vidsrc_sbs') return -1;
        if (b.id === 'vidsrc_sbs') return 1;
        return (a.responseTime || 999) - (b.responseTime || 999);
    });

    res.json(servers);
});

export default router;


