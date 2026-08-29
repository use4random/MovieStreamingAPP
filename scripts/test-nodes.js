/**
 * CinePulse Streaming Node Health Test Script
 * ============================================
 * Performs parallel health checks on all registered streaming nodes,
 * displays a detailed latency and status dashboard, and returns a non-zero
 * exit code if any node is failing.
 *
 * Usage:
 *   node scripts/test-nodes.js
 */

import { STREAM_SERVERS, checkNodeHealth } from '../server/utils/nodeHealth.js';

async function runNodeTests() {
    const startTime = Date.now();
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║               CINEPULSE STREAMING NODE TESTER                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`📡 Testing ${STREAM_SERVERS.length} nodes in parallel...\n`);

    const results = await Promise.allSettled(
        STREAM_SERVERS.map(node => checkNodeHealth(node))
    );

    let healthyCount = 0;
    let failedCount = 0;
    let totalResponseTime = 0;

    console.log(String.prototype.padEnd ? '' : 'Polyfill warning: String.prototype.padEnd not available');

    // Headers
    console.log('┌──────────────────────┬─────────────┬───────────┬─────────┬──────────────┐');
    console.log('│ Node Name            │ ID          │ Status    │ Code    │ Latency      │');
    console.log('├──────────────────────┼─────────────┼───────────┼─────────┼──────────────┤');

    const formattedResults = results.map((r, i) => {
        if (r.status === 'fulfilled') {
            return r.value;
        } else {
            return {
                id: STREAM_SERVERS[i].id,
                name: STREAM_SERVERS[i].name,
                status: 'ERROR',
                statusCode: 500,
                responseTime: 9999,
                healthy: false
            };
        }
    });

    formattedResults.forEach(node => {
        const nameCol = node.name.padEnd(20).substring(0, 20);
        const idCol = node.id.padEnd(11).substring(0, 11);
        
        let statusSymbol = '❓ UNKNOWN';
        if (node.status === 'HEALTHY') {
            statusSymbol = '✅ HEALTHY';
            healthyCount++;
            totalResponseTime += node.responseTime;
        } else if (node.status === 'TIMEOUT') {
            statusSymbol = '⏳ TIMEOUT';
            failedCount++;
        } else {
            statusSymbol = '❌ FAILED ';
            failedCount++;
        }

        const statusCol = statusSymbol.padEnd(9);
        const codeCol = String(node.statusCode || '-').padStart(3).padEnd(7);
        const latencyCol = `${node.responseTime}ms`.padStart(6).padEnd(12);

        console.log(`│ ${nameCol} │ ${idCol} │ ${statusCol} │ ${codeCol} │ ${latencyCol} │`);
    });

    console.log('└──────────────────────┴─────────────┴───────────┴─────────┴──────────────┘');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgLatency = healthyCount > 0 ? Math.round(totalResponseTime / healthyCount) : 0;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                         TEST SUMMARY                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`⏱️  Total Duration      : ${duration} seconds`);
    console.log(`📈 Healthy Nodes        : ${healthyCount} / ${STREAM_SERVERS.length}`);
    console.log(`🚨 Failed/Offline Nodes : ${failedCount} / ${STREAM_SERVERS.length}`);
    console.log(`⚡ Avg Healthy Latency  : ${avgLatency}ms`);
    console.log('================================================================\n');

    if (failedCount > 0) {
        console.error('🔴 ERROR: One or more streaming nodes are failing or offline!');
        process.exit(1);
    } else {
        console.log('💚 SUCCESS: All streaming nodes are healthy and responding!');
        process.exit(0);
    }
}

runNodeTests().catch(err => {
    console.error('Fatal testing error occurred:', err);
    process.exit(1);
});
