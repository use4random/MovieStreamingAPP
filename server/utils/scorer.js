/**
 * High-Performance Recommendation Scoring Utilities
 * Provides scoring routines for content similarity, collaborative signal,
 * recency decay, and quality weighting.
 */

// All standard TMDB Genre IDs
const ALL_GENRES = [
    28, 12, 16, 35, 80, 99, 18, 10751, 14, 36,
    27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37,
    10759, 10762, 10763, 10764, 10765, 10766, 10767, 10768, 37
];

/**
 * Encodes an array of genre IDs into a binary vector.
 * @param {Array<number>} genreIds 
 * @returns {Array<number>}
 */
export function encodeGenreVector(genreIds = []) {
    const ids = Array.isArray(genreIds) ? genreIds : [];
    return ALL_GENRES.map(id => (ids.includes(id) ? 1 : 0));
}

/**
 * Calculates Cosine Similarity between two binary/weighted vectors.
 * @param {Array<number>} vecA 
 * @param {Array<number>} vecB 
 * @returns {number} Value between 0.0 and 1.0
 */
export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Exponential Recency Decay: e^(-lambda * ageInYears)
 * @param {string|number} releaseDate YYYY-MM-DD or year string
 * @param {number} lambda Decay rate (default 0.25 -> ~2.7 year half-life)
 * @returns {number} Value between 0.0 and 1.0
 */
export function computeRecencyBoost(releaseDate, lambda = 0.25) {
    if (!releaseDate) return 0.2;
    const yearStr = String(releaseDate).substring(0, 4);
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) return 0.2;

    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - year);
    return Math.exp(-lambda * age);
}

/**
 * Computes Quality Score using Wilson Lower Bound / Log-weighted rating.
 * Prevents 10.0/10 from 2 voters outranking 8.2/10 from 5,000 voters.
 * @param {number} voteAverage 
 * @param {number} voteCount 
 * @returns {number} Normalized score 0.0 - 1.0
 */
export function computeQualityScore(voteAverage = 0, voteCount = 0) {
    const avg = Math.min(10, Math.max(0, Number(voteAverage) || 0));
    const cnt = Math.max(0, Number(voteCount) || 0);

    // Scale rating 0-1
    const baseRating = avg / 10;
    // Logarithmic scale confidence weight: log10(cnt + 1) / 4 (cap at 10,000 votes)
    const confidence = Math.min(1, Math.log10(cnt + 1) / 4);

    return baseRating * 0.7 + confidence * 0.3;
}

/**
 * Calculates a Hybrid Score for a candidate title relative to a seed item or user context.
 * 
 * Score = 0.35 * ContentSim + 0.30 * CoWatchScore + 0.15 * Recency + 0.15 * Quality + 0.05 * LangMatch - WatchedPenalty
 */
export function scoreCandidate({
    candidate,
    seedItem = null,
    coWatchScore = 0,
    userHistoryIds = new Set(),
    weights = { content: 0.35, cowatch: 0.30, recency: 0.15, quality: 0.15, lang: 0.05 }
}) {
    let contentSim = 0;
    let langMatch = 0;

    if (seedItem) {
        // Parse genre IDs
        const seedGenres = Array.isArray(seedItem.genre_ids)
            ? seedItem.genre_ids
            : (typeof seedItem.genre_ids === 'string' ? JSON.parse(seedItem.genre_ids || '[]') : []);
        const candGenres = Array.isArray(candidate.genre_ids)
            ? candidate.genre_ids
            : (typeof candidate.genre_ids === 'string' ? JSON.parse(candidate.genre_ids || '[]') : []);

        const vecA = encodeGenreVector(seedGenres);
        const vecB = encodeGenreVector(candGenres);
        contentSim = cosineSimilarity(vecA, vecB);

        if (seedItem.original_language && candidate.original_language && seedItem.original_language === candidate.original_language) {
            langMatch = 1.0;
        }
    }

    const recency = computeRecencyBoost(candidate.release_date || candidate.first_air_date);
    const quality = computeQualityScore(candidate.vote_average, candidate.vote_count);
    const safeCoWatch = Math.min(1.0, Math.max(0, coWatchScore));

    let score = (contentSim * weights.content) +
                (safeCoWatch * weights.cowatch) +
                (recency * weights.recency) +
                (quality * weights.quality) +
                (langMatch * weights.lang);

    // Apply penalty if user already watched this candidate
    const candIdStr = String(candidate.id || candidate.tmdb_id);
    if (userHistoryIds.has(candIdStr)) {
        score -= 0.4;
    }

    return Math.max(0, score);
}

/**
 * Diversifies results to prevent category flooding (anti-bubble filter).
 * Max `maxPerGenre` items with identical top genre.
 * @param {Array<Object>} candidates Scored candidates array [{ item, score }, ...]
 * @param {number} limit Maximum return items
 * @param {number} maxPerGenre Max items sharing the primary genre
 * @returns {Array<Object>}
 */
export function diversifyResults(candidates = [], limit = 12, maxPerGenre = 3) {
    const genreCounts = new Map();
    const result = [];

    // Sort by score desc
    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    for (const entry of sorted) {
        if (result.length >= limit) break;

        const genres = Array.isArray(entry.item.genre_ids)
            ? entry.item.genre_ids
            : (typeof entry.item.genre_ids === 'string' ? JSON.parse(entry.item.genre_ids || '[]') : []);
        
        const primaryGenre = genres[0] || 'unknown';
        const currentCount = genreCounts.get(primaryGenre) || 0;

        if (currentCount < maxPerGenre || result.length < limit / 2) {
            result.push(entry.item);
            genreCounts.set(primaryGenre, currentCount + 1);
        }
    }

    // Fill remaining if needed
    if (result.length < limit) {
        for (const entry of sorted) {
            if (result.length >= limit) break;
            if (!result.some(r => (r.id || r.tmdb_id) === (entry.item.id || entry.item.tmdb_id))) {
                result.push(entry.item);
            }
        }
    }

    return result;
}
