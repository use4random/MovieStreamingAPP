import NodeCache from 'node-cache';

// Fallback in-memory cache instance (5 min default TTL)
const localCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = Boolean(redisUrl && redisToken);

if (isRedisConfigured) {
    console.log('[Cache Engine]: Initialized with Upstash Distributed Redis REST Gateway');
} else {
    console.log('[Cache Engine]: Initialized with In-Memory NodeCache Fallback');
}

/**
 * Unified Cache Abstraction Layer
 * Supports Upstash Redis REST API with seamless In-Memory Fallback.
 */
export const cache = {
    /**
     * Retrieve cached object by key
     * @param {string} key
     * @returns {Promise<any|null>}
     */
    async get(key) {
        if (!key) return null;

        if (isRedisConfigured) {
            try {
                const res = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, {
                    headers: { Authorization: `Bearer ${redisToken}` }
                });
                if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
                const data = await res.json();
                if (data && data.result) {
                    try {
                        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
                    } catch {
                        return data.result;
                    }
                }
                return null;
            } catch (err) {
                console.warn(`[Cache Warning]: Redis get failed for ${key}, falling back to local memory:`, err.message);
                return localCache.get(key) || null;
            }
        }

        return localCache.get(key) || null;
    },

    /**
     * Store object in cache with specified TTL
     * @param {string} key
     * @param {any} value
     * @param {number} ttlInSeconds Default: 300 (5 minutes)
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttlInSeconds = 300) {
        if (!key || value === undefined || value === null) return false;

        localCache.set(key, value, ttlInSeconds);

        if (isRedisConfigured) {
            try {
                const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
                const res = await fetch(`${redisUrl}/set/${encodeURIComponent(key)}?EX=${ttlInSeconds}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${redisToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: serialized
                });
                return res.ok;
            } catch (err) {
                console.warn(`[Cache Warning]: Redis set failed for ${key}:`, err.message);
            }
        }

        return true;
    }
};
