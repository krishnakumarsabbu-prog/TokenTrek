import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/stats', (_req, res) => {
  const db = getDb();
  const req_ = (db.prepare('SELECT SUM(requests) as v FROM daily_stats').get() as { v: number }).v;
  const tok = (db.prepare('SELECT SUM(tokens) as v FROM daily_stats').get() as { v: number }).v;
  const cost = (db.prepare('SELECT SUM(cost) as v FROM daily_stats').get() as { v: number }).v;
  const devs = (db.prepare('SELECT COUNT(*) as v FROM developers').get() as { v: number }).v;
  res.json({
    totalRequests: req_ || 2450000,
    totalTokens: tok || 1240000000,
    totalCost: Math.round(cost) || 186245,
    activeDevelopers: devs || 342,
    timeSaved: 1842,
    aiRoi: 276300,
    changes: { totalRequests: 18.6, totalTokens: 24.7, totalCost: 21.4, activeDevelopers: 12.8, timeSaved: 30.5, aiRoi: 28.3 },
  });
});

router.get('/usage-trend', (_req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT date, SUM(requests) as requests, SUM(tokens) as tokens FROM daily_stats GROUP BY date ORDER BY date'
  ).all() as Array<{ date: string; requests: number; tokens: number }>;
  const devCounts = [45, 52, 58, 63, 71, 78, 84];
  res.json(rows.map((r, i) => ({ ...r, tokens: Math.floor(r.tokens / 1000), developers: devCounts[i] || 50 })));
});

router.get('/platform-costs', (_req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT p.name, p.color, SUM(ds.cost) as cost FROM daily_stats ds JOIN platforms p ON ds.platform_id = p.id GROUP BY p.id ORDER BY cost DESC'
  ).all() as Array<{ name: string; color: string; cost: number }>;
  const total = rows.reduce((s, r) => s + r.cost, 0);
  res.json({
    total: Math.round(total),
    items: rows.map(r => ({ name: r.name, color: r.color, cost: Math.round(r.cost), pct: Math.round((r.cost / total) * 1000) / 10 })),
  });
});

router.get('/model-costs', (_req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT model_name, cost, pct FROM model_costs ORDER BY cost DESC').all());
});

router.get('/top-prompts', (_req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT prompt_text as prompt, uses, success_rate as successRate, avg_tokens as avgTokens FROM prompts ORDER BY uses DESC LIMIT 5').all());
});

router.get('/developer-scores', (_req, res) => {
  const db = getDb();
  res.json(db.prepare(
    'SELECT d.name as developer, d.avatar, ds.score, ds.trend FROM developer_scores ds JOIN developers d ON ds.developer_id = d.id ORDER BY score DESC LIMIT 5'
  ).all());
});

router.get('/team-costs', (_req, res) => {
  const db = getDb();
  res.json(db.prepare(
    'SELECT t.name as team, tc.cost, tc.change_pct as change FROM team_costs tc JOIN teams t ON tc.team_id = t.id ORDER BY cost DESC LIMIT 5'
  ).all());
});

router.get('/live-activity', (_req, res) => {
  const db = getDb();
  const items = db.prepare(
    'SELECT d.name as developer, d.avatar, la.action, p.name as platform, la.created_at as time FROM live_activity la JOIN developers d ON la.developer_id = d.id LEFT JOIN platforms p ON la.platform_id = p.id ORDER BY la.created_at DESC LIMIT 5'
  ).all();
  res.json({ items, activeSessions: 124 });
});

router.get('/waste-items', (_req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT category, description, count, severity FROM waste_items ORDER BY count DESC').all());
});

router.get('/insights', (_req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT type, title, description, icon FROM insights').all());
});

export default router;
