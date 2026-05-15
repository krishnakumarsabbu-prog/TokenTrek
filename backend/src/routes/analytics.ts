import { Router } from 'express';
import {
  computeTotals,
  computeDailyUsage,
  computePlatformUsage,
  computeDeveloperScores,
  computePromptRanking,
  computeTeamRanking,
  computeModelEfficiency,
  computeAIWaste,
  computeRecommendations,
  computeFullReport,
} from '../analytics';

const router = Router();

// GET /api/analytics/report — full analytics report
router.get('/report', (_req, res) => {
  res.json(computeFullReport());
});

// GET /api/analytics/totals
router.get('/totals', (_req, res) => {
  res.json(computeTotals());
});

// GET /api/analytics/daily-usage
router.get('/daily-usage', (_req, res) => {
  res.json(computeDailyUsage());
});

// GET /api/analytics/platform-usage
router.get('/platform-usage', (_req, res) => {
  res.json(computePlatformUsage());
});

// GET /api/analytics/developer-scores
router.get('/developer-scores', (_req, res) => {
  res.json(computeDeveloperScores());
});

// GET /api/analytics/prompt-ranking
router.get('/prompt-ranking', (_req, res) => {
  res.json(computePromptRanking());
});

// GET /api/analytics/team-ranking
router.get('/team-ranking', (_req, res) => {
  res.json(computeTeamRanking());
});

// GET /api/analytics/model-efficiency
router.get('/model-efficiency', (_req, res) => {
  res.json(computeModelEfficiency());
});

// GET /api/analytics/ai-waste
router.get('/ai-waste', (_req, res) => {
  res.json(computeAIWaste());
});

// GET /api/analytics/recommendations
router.get('/recommendations', (_req, res) => {
  res.json(computeRecommendations());
});

export default router;
