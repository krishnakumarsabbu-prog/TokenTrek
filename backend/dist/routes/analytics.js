"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_1 = require("../analytics");
const router = (0, express_1.Router)();
// GET /api/analytics/report — full analytics report
router.get('/report', (_req, res) => {
    res.json((0, analytics_1.computeFullReport)());
});
// GET /api/analytics/totals
router.get('/totals', (_req, res) => {
    res.json((0, analytics_1.computeTotals)());
});
// GET /api/analytics/daily-usage
router.get('/daily-usage', (_req, res) => {
    res.json((0, analytics_1.computeDailyUsage)());
});
// GET /api/analytics/platform-usage
router.get('/platform-usage', (_req, res) => {
    res.json((0, analytics_1.computePlatformUsage)());
});
// GET /api/analytics/developer-scores
router.get('/developer-scores', (_req, res) => {
    res.json((0, analytics_1.computeDeveloperScores)());
});
// GET /api/analytics/prompt-ranking
router.get('/prompt-ranking', (_req, res) => {
    res.json((0, analytics_1.computePromptRanking)());
});
// GET /api/analytics/team-ranking
router.get('/team-ranking', (_req, res) => {
    res.json((0, analytics_1.computeTeamRanking)());
});
// GET /api/analytics/model-efficiency
router.get('/model-efficiency', (_req, res) => {
    res.json((0, analytics_1.computeModelEfficiency)());
});
// GET /api/analytics/ai-waste
router.get('/ai-waste', (_req, res) => {
    res.json((0, analytics_1.computeAIWaste)());
});
// GET /api/analytics/recommendations
router.get('/recommendations', (_req, res) => {
    res.json((0, analytics_1.computeRecommendations)());
});
exports.default = router;
