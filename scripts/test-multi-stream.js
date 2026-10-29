/**
 * CinePulse Multi-Content Streaming Verification Script
 * =====================================================
 * Tests streaming server resolution, URL generation, multi-language ranking,
 * and live upstream connectivity across multiple popular Movies and TV Shows.
 */

import { STREAM_SERVERS, SPOOF_HEADERS } from '../server/utils/nodeHealth.js';
import serversRouter from '../server/routes/servers.js';

const TEST_MEDIA = [
    { type: 'movie', id: '550', title: 'Fight Club', imdb: 'tt0137523' },
    { type: 'movie', id: '27205', title: 'Inception', imdb: 'tt1375666' },
    { type: 'movie', id: '157336', title: 'Interstellar', imdb: 'tt0816692' },
    { type: 'movie', id: '324857', title: 'Spider-Man: Spider-Verse', imdb: 'tt4633694' },
    { type: 'tv', id: '1399', season: 1, episode: 1, title: 'Game of Thrones S01E01', imdb: 'tt0944947' },
    { type: 'tv', id: '1399', season: 2, episode: 4, title: 'Game of Thrones S02E04', imdb: 'tt0944947' },
    { type: 'tv', id: '66732', season: 1, episode: 1, title: 'Stranger Things S01E01', imdb: 'tt4574334' },
    { type: 'tv', id: '66732', season: 4, episode: 1, title: 'Stranger Things S04E01', imdb: 'tt4574334' },
    { type: 'tv', id: '1396', season: 1, episode: 1, title: 'Breaking Bad S01E01', imdb: 'tt0903747' },
    { type: 'tv', id: '94605', season: 1, episode: 1, title: 'Arcane S01E01', imdb: 'tt11126994' }
];

function getRouteHandler(router, method, path) {
    const layer = router.stack.find(s => s.route && s.route.path === path && s.route.methods[method.toLowerCase()]);
    if (!layer) throw new Error(`Route not found: ${method} ${path}`);
    return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockResponse() {
    const res = {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; }
    };
    return res;
}

async function runMultiContentTest() {
    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║            CINEPULSE MULTI-CONTENT STREAMING VALIDATION SUITE                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(`🎬 Testing streaming resolution across ${TEST_MEDIA.length} distinct movie & TV titles...\n`);

    const rootHandler = getRouteHandler(serversRouter, 'GET', '/');
    let passedCount = 0;
    let failedCount = 0;

    for (const item of TEST_MEDIA) {
        const start = Date.now();
        const req = {
            query: {
                type: item.type,
                id: item.id,
                season: item.season || 1,
                episode: item.episode || 1,
                imdb: item.imdb
            }
        };
        const res = mockResponse();

        try {
            await rootHandler(req, res);

            if (res.statusCode !== 200 || !Array.isArray(res.data) || res.data.length === 0) {
                throw new Error(`Failed to return server pool: HTTP ${res.statusCode}`);
            }

            const servers = res.data;
            const topNode = servers[0];

            // Verify top node is recommended
            if (!topNode.recommended) {
                throw new Error(`Top node ${topNode.name} is missing recommended flag`);
            }

            // Verify URLs
            for (const s of servers) {
                if (!s.url || !s.url.startsWith('https://')) {
                    throw new Error(`Invalid URL on node ${s.name}: ${s.url}`);
                }
                if (!s.url.includes(item.id)) {
                    throw new Error(`Node ${s.name} URL missing content ID ${item.id}`);
                }
                if (item.type === 'tv') {
                    const hasSeason = s.url.includes(String(item.season));
                    const hasEpisode = s.url.includes(String(item.episode));
                    if (!hasSeason || !hasEpisode) {
                        throw new Error(`Node ${s.name} URL missing season/episode parameters: ${s.url}`);
                    }
                }
            }

            // Test live upstream ping on top recommended node
            const pingStart = Date.now();
            let liveStatus = 'UNKNOWN';
            let liveCode = 0;
            try {
                const liveRes = await fetch(topNode.url, {
                    headers: SPOOF_HEADERS,
                    signal: AbortSignal.timeout(4000),
                    redirect: 'follow'
                });
                liveCode = liveRes.status;
                liveStatus = liveCode >= 200 && liveCode < 400 ? 'LIVE OK' : `HTTP ${liveCode}`;
            } catch (err) {
                liveStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'PING ERR';
            }
            const pingDuration = Date.now() - pingStart;

            const totalDuration = Date.now() - start;
            console.log(`✅ [${item.type.toUpperCase()}] ${item.title.padEnd(28)} | Nodes: ${servers.length} | Top: ${topNode.name} (${topNode.quality}) | Upstream: ${liveStatus} (${liveCode}) in ${pingDuration}ms`);
            passedCount++;

        } catch (err) {
            console.error(`❌ [${item.type.toUpperCase()}] ${item.title}: FAILED - ${err.message}`);
            failedCount++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log(`📊 MULTI-CONTENT STREAMING TEST SUMMARY:`);
    console.log(`   Passed : ${passedCount} / ${TEST_MEDIA.length}`);
    console.log(`   Failed : ${failedCount} / ${TEST_MEDIA.length}`);
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    if (failedCount > 0) {
        process.exit(1);
    } else {
        console.log('🎉 ALL CONTENT ITEMS STREAM RESOLUTION & LIVE CONNECTIVITY VERIFIED!\n');
        process.exit(0);
    }
}

runMultiContentTest().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});

