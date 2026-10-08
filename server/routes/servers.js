import express from 'express';
import { cache } from '../utils/cache.js';
import { STREAM_SERVERS, getInstantHealthData, refreshHealthCacheBackground } from '../utils/nodeHealth.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    const healthData = getInstantHealthData();
    res.json(healthData);
});

router.get('/', async (req, res) => {
    const { type = 'movie', id, imdb, season = 1, episode = 1 } = req.query;

    const healthData = getInstantHealthData();

    // Map servers and attach real dynamic ping & health filtering
    let servers = STREAM_SERVERS.map(s => {
        const h = healthData.nodes?.find(n => n.id === s.id);
        const healthy = h ? h.healthy : true;
        const responseTime = h ? h.responseTime : 150;
        const isMultiLang = !!s.isMultiLang;

        return {
            id: s.id,
            name: s.name,
            icon: s.icon,
            ping: healthy ? `${responseTime}ms` : s.ping,
            quality: s.quality,
            type: s.type,
            isMultiLang: isMultiLang,
            healthy: healthy,
            responseTime: responseTime,
            url: id ? s.getUrl(type, id, season, episode, imdb) : null
        };
    });

    // ALGORITHM: Multi-Language Prioritization with Ultra-Fast Fallback & Reference Ranking
    // 1. Multi-Language Prioritization: If healthy multi-language nodes exist, prioritize them (+10000 boost)
    //    so the best multi-audio/subtitle stream is auto-selected first when content is clicked.
    // 2. Speed Bonus: (1000 - min(responseTime, 1000))
    // 3. Fallback: If no multi-lang node is available, default to the fastest functional node.
    const healthyServers = servers.filter(s => s.healthy !== false);
    const serverPool = healthyServers.length > 0 ? healthyServers : servers;

    serverPool.sort((a, b) => {
        if (a.healthy && !b.healthy) return -1;
        if (!a.healthy && b.healthy) return 1;

        const scoreA = (a.isMultiLang ? 10000 : 0) + (1000 - Math.min(a.responseTime || 999, 1000));
        const scoreB = (b.isMultiLang ? 10000 : 0) + (1000 - Math.min(b.responseTime || 999, 1000));

        return scoreB - scoreA;
    });

    // Attach reference metadata & auto-selection indicators
    if (serverPool.length > 0) {
        const hasHealthyMultiLang = serverPool.some(s => s.isMultiLang && s.healthy);
        serverPool.forEach((s, idx) => {
            s.priorityRank = idx + 1;
            s.recommended = idx === 0;
            s.recommendationReason = idx === 0
                ? (hasHealthyMultiLang ? '★ Preferred Multi-Language Node (Multi-Audio & Subtitles Auto-Selected)' : '⚡ Ultra-Fast Edge Node Auto-Selected')
                : null;
        });
    }

    res.json(serverPool);
});

export default router;


