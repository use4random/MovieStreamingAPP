import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    encodeGenreVector,
    cosineSimilarity,
    computeRecencyBoost,
    computeQualityScore,
    scoreCandidate,
    diversifyResults
} from '../../server/utils/scorer.js';

describe('Scorer Utility Unit Tests', () => {
    describe('encodeGenreVector()', () => {
        it('should return a binary array matching ALL_GENRES length', () => {
            const vector = encodeGenreVector([28, 12]);
            assert.ok(Array.isArray(vector));
            assert.strictEqual(vector.length, 28);
            // Genre 28 and 12 should be 1, others 0
            assert.strictEqual(vector[0], 1); // 28 is first in ALL_GENRES
            assert.strictEqual(vector[1], 1); // 12 is second in ALL_GENRES
            assert.strictEqual(vector[2], 0); // 16 is third
        });

        it('should handle empty or invalid genre inputs gracefully', () => {
            const emptyVec = encodeGenreVector([]);
            assert.strictEqual(emptyVec.length, 28);
            assert.ok(emptyVec.every(val => val === 0));

            const nullVec = encodeGenreVector(null);
            assert.strictEqual(nullVec.length, 28);
            assert.ok(nullVec.every(val => val === 0));

            const undefinedVec = encodeGenreVector(undefined);
            assert.strictEqual(undefinedVec.length, 28);
            assert.ok(undefinedVec.every(val => val === 0));
        });
    });

    describe('cosineSimilarity()', () => {
        it('should return 1.0 for identical non-zero vectors', () => {
            const vecA = [1, 0, 1, 0, 1];
            const sim = cosineSimilarity(vecA, vecA);
            assert.strictEqual(Math.round(sim * 1000) / 1000, 1.0);
        });

        it('should return 0.0 for orthogonal vectors', () => {
            const vecA = [1, 0, 0];
            const vecB = [0, 1, 0];
            const sim = cosineSimilarity(vecA, vecB);
            assert.strictEqual(sim, 0);
        });

        it('should return 0 when vectors have mismatched lengths', () => {
            const vecA = [1, 1];
            const vecB = [1, 1, 1];
            assert.strictEqual(cosineSimilarity(vecA, vecB), 0);
        });

        it('should return 0 for all-zero vectors or null inputs', () => {
            assert.strictEqual(cosineSimilarity([0, 0], [0, 0]), 0);
            assert.strictEqual(cosineSimilarity(null, [1, 0]), 0);
            assert.strictEqual(cosineSimilarity([1, 0], null), 0);
        });

        it('should calculate accurate intermediate cosine similarity', () => {
            const vecA = [1, 1, 0, 0];
            const vecB = [1, 0, 1, 0];
            // dot = 1, normA = sqrt(2), normB = sqrt(2) => 1 / 2 = 0.5
            const sim = cosineSimilarity(vecA, vecB);
            assert.strictEqual(Math.round(sim * 1000) / 1000, 0.5);
        });
    });

    describe('computeRecencyBoost()', () => {
        it('should return 1.0 for current year releases', () => {
            const currentYear = new Date().getFullYear();
            const boost = computeRecencyBoost(`${currentYear}-05-20`);
            assert.strictEqual(Math.round(boost * 1000) / 1000, 1.0);
        });

        it('should decay exponentially for older releases', () => {
            const currentYear = new Date().getFullYear();
            const year1 = computeRecencyBoost(`${currentYear - 1}-01-01`);
            const year5 = computeRecencyBoost(`${currentYear - 5}-01-01`);
            const year10 = computeRecencyBoost(`${currentYear - 10}-01-01`);

            assert.ok(year1 < 1.0);
            assert.ok(year5 < year1);
            assert.ok(year10 < year5);
            assert.ok(year10 > 0);
        });

        it('should return baseline fallback 0.2 for invalid or missing dates', () => {
            assert.strictEqual(computeRecencyBoost(null), 0.2);
            assert.strictEqual(computeRecencyBoost(''), 0.2);
            assert.strictEqual(computeRecencyBoost('invalid-date'), 0.2);
        });
    });

    describe('computeQualityScore()', () => {
        it('should compute balanced score accounting for vote average and count confidence', () => {
            const highRatedHighVotes = computeQualityScore(9.0, 10000);
            const highRatedLowVotes = computeQualityScore(9.0, 5);

            assert.ok(highRatedHighVotes > highRatedLowVotes);
            assert.ok(highRatedHighVotes <= 1.0);
            assert.ok(highRatedLowVotes > 0);
        });

        it('should handle edge boundaries gracefully', () => {
            const zeroScore = computeQualityScore(0, 0);
            assert.strictEqual(zeroScore, 0);

            const cappedScore = computeQualityScore(15, 50000); // rating > 10
            assert.ok(cappedScore <= 1.0);
        });
    });

    describe('scoreCandidate()', () => {
        it('should compute weighted hybrid score with content similarity and language match', () => {
            const seed = {
                id: 100,
                genre_ids: [28, 12],
                original_language: 'en'
            };
            const matchingCandidate = {
                id: 101,
                genre_ids: [28, 12],
                original_language: 'en',
                release_date: `${new Date().getFullYear()}-01-01`,
                vote_average: 8.5,
                vote_count: 2000
            };

            const score = scoreCandidate({
                candidate: matchingCandidate,
                seedItem: seed,
                coWatchScore: 0.8
            });

            assert.ok(typeof score === 'number');
            assert.ok(score > 0.5);
        });

        it('should apply penalty if candidate is in user history', () => {
            const seed = { id: 100, genre_ids: [28] };
            const candidate = { id: 101, genre_ids: [28], release_date: '2024-01-01', vote_average: 8.0, vote_count: 500 };

            const scoreWithoutHistory = scoreCandidate({
                candidate,
                seedItem: seed,
                userHistoryIds: new Set()
            });

            const scoreWithHistory = scoreCandidate({
                candidate,
                seedItem: seed,
                userHistoryIds: new Set(['101'])
            });

            assert.ok(scoreWithHistory < scoreWithoutHistory);
            assert.ok(scoreWithoutHistory - scoreWithHistory >= 0.39); // 0.4 penalty
        });
    });

    describe('diversifyResults()', () => {
        it('should prevent genre saturation and cap items per primary genre', () => {
            const candidates = [
                { item: { id: 1, genre_ids: [28] }, score: 0.95 },
                { item: { id: 2, genre_ids: [28] }, score: 0.94 },
                { item: { id: 3, genre_ids: [28] }, score: 0.93 },
                { item: { id: 4, genre_ids: [28] }, score: 0.92 }, // 4th item of genre 28
                { item: { id: 5, genre_ids: [35] }, score: 0.85 },
                { item: { id: 6, genre_ids: [18] }, score: 0.80 },
                { item: { id: 7, genre_ids: [878] }, score: 0.75 },
            ];

            const diversified = diversifyResults(candidates, 5, 2);
            assert.strictEqual(diversified.length, 5);

            // Count genre 28 items in first 5 results
            const genre28Count = diversified.filter(i => i.genre_ids[0] === 28).length;
            assert.ok(genre28Count <= 3);
        });

        it('should handle empty candidates array', () => {
            const res = diversifyResults([], 10, 3);
            assert.deepStrictEqual(res, []);
        });
    });
});
