import { Router } from 'express';
import { store } from '../db';
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
  computeDeveloperXP,
  computeAIInsights,
} from '../analytics';

const router = Router();

router.get('/ai-insights', (_req, res) => { res.json(computeAIInsights()); });
router.get('/report', (_req, res) => { res.json(computeFullReport()); });
router.get('/developer-xp', (_req, res) => { res.json(computeDeveloperXP()); });
router.get('/totals', (_req, res) => { res.json(computeTotals()); });
router.get('/daily-usage', (_req, res) => { res.json(computeDailyUsage()); });
router.get('/platform-usage', (_req, res) => { res.json(computePlatformUsage()); });
router.get('/developer-scores', (_req, res) => { res.json(computeDeveloperScores()); });
router.get('/prompt-ranking', (_req, res) => { res.json(computePromptRanking()); });
router.get('/team-ranking', (_req, res) => { res.json(computeTeamRanking()); });
router.get('/model-efficiency', (_req, res) => { res.json(computeModelEfficiency()); });
router.get('/ai-waste', (_req, res) => { res.json(computeAIWaste()); });
router.get('/recommendations', (_req, res) => { res.json(computeRecommendations()); });

// ── Marketplace ────────────────────────────────────────────────────────────────
// Returns prompts from the store. Empty until prompts are loaded via Upload Center.
router.get('/marketplace', (_req, res) => {
  const storePrompts = store.prompts || [];
  if (storePrompts.length === 0) {
    return res.json([]);
  }
  const items = storePrompts.map((p) => ({
    id: p.id,
    title: p.prompt_text.length > 60 ? p.prompt_text.slice(0, 60) + '...' : p.prompt_text,
    description: p.prompt_text,
    prompt: p.prompt_text,
    category: 'General',
    author: 'Unknown',
    rating: parseFloat((p.success_rate / 20).toFixed(1)),
    uses: p.uses,
    tokens: p.avg_tokens,
    successRate: p.success_rate,
    tags: [],
    verified: false,
  }));
  res.json(items);
});

// ── Replay Center ──────────────────────────────────────────────────────────────
// Returns real AI session replays. Empty until sessions are recorded.
router.get('/replay', (_req, res) => {
  res.json([]);
});

// ── Reports ────────────────────────────────────────────────────────────────────
router.get('/reports', (_req, res) => {
  const daily_stats = store.daily_stats || [];
  const developers = store.developers || [];

  if (daily_stats.length === 0 || developers.length === 0) {
    return res.json({
      summary: {
        total_cost: 0,
        total_tokens: 0,
        total_requests: 0,
        active_developers: 0,
        cost_change: 0,
        token_change: 0,
        request_change: 0,
        period: '',
      },
      reports: [],
      daily_breakdown: [],
      platform_breakdown: [],
      team_breakdown: [],
      model_breakdown: [],
    });
  }

  const totals = computeTotals();

  let cost_change = 0;
  let token_change = 0;
  let request_change = 0;
  let period_str = 'Recent Period';

  const dailyUsage = computeDailyUsage();
  if (dailyUsage.length >= 14) {
    const lastWeek = dailyUsage.slice(-7);
    const prevWeek = dailyUsage.slice(-14, -7);
    const lastCost = lastWeek.reduce((s, d) => s + d.cost, 0);
    const prevCost = prevWeek.reduce((s, d) => s + d.cost, 0);
    const lastTokens = lastWeek.reduce((s, d) => s + d.tokens, 0);
    const prevTokens = prevWeek.reduce((s, d) => s + d.tokens, 0);
    const lastRequests = lastWeek.reduce((s, d) => s + d.requests, 0);
    const prevRequests = prevWeek.reduce((s, d) => s + d.requests, 0);
    cost_change = prevCost > 0 ? parseFloat((((lastCost - prevCost) / prevCost) * 100).toFixed(1)) : 0;
    token_change = prevTokens > 0 ? parseFloat((((lastTokens - prevTokens) / prevTokens) * 100).toFixed(1)) : 0;
    request_change = prevRequests > 0 ? parseFloat((((lastRequests - prevRequests) / prevRequests) * 100).toFixed(1)) : 0;
    const startObj = new Date(lastWeek[0].date);
    const endObj = new Date(lastWeek[lastWeek.length - 1].date);
    period_str = `${startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (dailyUsage.length > 0) {
    const startObj = new Date(dailyUsage[0].date);
    const endObj = new Date(dailyUsage[dailyUsage.length - 1].date);
    period_str = `${startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  // Reports list is empty until reports are actually generated
  const reports: any[] = [];

  res.json({
    summary: {
      total_cost: totals.totalCost,
      total_tokens: totals.totalTokens,
      total_requests: totals.totalRequests,
      active_developers: developers.length,
      cost_change,
      token_change,
      request_change,
      period: period_str,
    },
    reports,
    daily_breakdown: computeDailyUsage(),
    platform_breakdown: computePlatformUsage(),
    team_breakdown: computeTeamRanking(),
    model_breakdown: computeModelEfficiency(),
  });
});

// ── UI Config ──────────────────────────────────────────────────────────────────
// Static styling config for the frontend — not application data
router.get('/config', (_req, res) => {
  res.json({
    categoryColors: {
      Engineering:   { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
      Testing:       { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
      Database:      { bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
      Documentation: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9' },
      Frontend:      { bg: '#ecfdf5', color: '#059669', dot: '#10b981' },
      Security:      { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
      Performance:   { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
      DevOps:        { bg: '#f0f9ff', color: '#0369a1', dot: '#38bdf8' },
      Data:          { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7' },
      Architecture:  { bg: '#f8fafc', color: '#475569', dot: '#64748b' },
    },
    modelColors: {
      'Claude 3.5 Sonnet': '#e07b39',
      'Claude 3.5 Haiku':  '#f97316',
      'Claude 3 Haiku':    '#fdba74',
      'GPT-4o':            '#10a37f',
      'GPT-4o mini':       '#2dd4bf',
      'GPT-4 Turbo':       '#059669',
      'Gemini 1.5 Pro':    '#8b5cf6',
      'Gemini 1.5 Flash':  '#a78bfa',
      'Llama 3.1 70B':     '#3b82f6',
      'Llama 3.1 8B':      '#60a5fa',
    },
    timelineConfig: {
      start:      { label: 'Session Started',        icon: 'Play'          },
      prompt:     { label: 'Prompt Submitted',        icon: 'Send'          },
      processing: { label: 'Processing',              icon: 'Loader2'       },
      response:   { label: 'Response Received',       icon: 'MessageSquare' },
      review:     { label: 'Reviewing Suggestions',   icon: 'Eye'           },
      accepted:   { label: 'Suggestions Accepted',    icon: 'Check'         },
      rejected:   { label: 'Suggestions Rejected',    icon: 'X'             },
      warning:    { label: 'Warning/Alert',            icon: 'AlertTriangle' },
      end:        { label: 'Session Ended',            icon: 'Power'         },
    },
    typeColors: {
      executive:    { bg: '#eff6ff', color: '#2563eb' },
      productivity: { bg: '#f0fdf4', color: '#16a34a' },
      cost:         { bg: '#fff7ed', color: '#ea580c' },
      waste:        { bg: '#fef2f2', color: '#dc2626' },
      security:     { bg: '#fdf4ff', color: '#9333ea' },
      performance:  { bg: '#fef9c3', color: '#a16207' },
    },
    platformColors: {
      Claude:           '#e07b39',
      'GPT-4o':         '#10a37f',
      Cursor:           '#0078d4',
      'GitHub Copilot': '#6366f1',
    },
  });
});

export default router;
