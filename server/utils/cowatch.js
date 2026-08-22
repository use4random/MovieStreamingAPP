/**
 * Collaborative Filtering Matrix Generator
 * Automatically tracks co-occurrences of content consumption per user.
 */

import db, { upsertCoWatchStmt, getCoWatchedItemsStmt, getHistoryByUserIdStmt } from '../data/db.js';

/**
 * Records co-watch links whenever a user plays/watches a media item.
 * Connects the current item to all recent items watched by the same user.
 * 
 * @param {string} userId 
 * @param {string|number} currentMediaId 
 * @param {string} currentMediaType 'movie' | 'tv'
 */
export async function recordCoWatch(userId, currentMediaId, currentMediaType = 'movie') {
    if (!userId || userId === 'guest' || !currentMediaId) return;

    try {
        const curIdStr = String(currentMediaId);
        const curType = String(currentMediaType);

        // Fetch user's recent watch history (last 15 items)
        const recentHistory = getHistoryByUserIdStmt.all(userId);
        if (!recentHistory || recentHistory.length === 0) return;

        const updateTx = db.transaction(() => {
            for (const prev of recentHistory) {
                const prevIdStr = String(prev.id);
                const prevType = String(prev.media_type || 'movie');

                // Skip self-referential links
                if (prevIdStr === curIdStr && prevType === curType) continue;

                // Insert/increment bidirectional links A -> B and B -> A
                upsertCoWatchStmt.run(curIdStr, curType, prevIdStr, prevType);
                upsertCoWatchStmt.run(prevIdStr, prevType, curIdStr, curType);
            }
        });

        updateTx();
    } catch (err) {
        console.warn('[CoWatch] Failed to record co-watch matrix link:', err.message);
    }
}

/**
 * Retrieves collaborative filtering items co-watched with a target item.
 * 
 * @param {string|number} mediaId 
 * @param {string} mediaType 
 * @param {number} limit 
 * @returns {Array<{ id: string, media_type: string, co_count: number }>}
 */
export function getCoWatchedItems(mediaId, mediaType = 'movie', limit = 20) {
    try {
        return getCoWatchedItemsStmt.all(String(mediaId), String(mediaType), limit);
    } catch (err) {
        console.warn('[CoWatch] Failed to fetch co-watched items:', err.message);
        return [];
    }
}
