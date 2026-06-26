import { Router } from 'express';
import { store, DevinSession, DevinDeveloperStat, DevinTeamStat } from '../db';

let _idSeq = 1;
function newId() { return `devin-${Date.now()}-${_idSeq++}`; }

const router = Router();

function recomputeDevinStats() {
  // Aggregate per developer
  const devMap = new Map<string, DevinDeveloperStat>();
  for (const s of store.devin_sessions) {
    let stat = devMap.get(s.user_email);
    if (!stat) {
      stat = {
        user_email: s.user_email,
        user_name: s.user_name,
        team_name: s.team_id || s.org_name || 'Unknown',
        sessions: 0,
        acu_used: 0,
        total_prs: 0,
        merged_prs: 0,
        open_prs: 0,
        failed_prs: 0,
        categories: [],
        ai_score: 0,
      };
      devMap.set(s.user_email, stat);
    }
    stat.sessions += 1;
    stat.acu_used += s.acu_used;
    for (const pr of s.pull_requests) {
      stat.total_prs += 1;
      if (pr.pr_status === 'merged') stat.merged_prs += 1;
      else if (pr.pr_status === 'open') stat.open_prs += 1;
      else stat.failed_prs += 1;
    }
    if (s.category && !stat.categories.includes(s.category)) {
      stat.categories.push(s.category);
    }
  }

  // Compute AI score per developer
  for (const stat of devMap.values()) {
    const mergedWeight = stat.merged_prs * 40;
    const sessionWeight = Math.min(stat.sessions * 30, 300);
    const acuEfficiency = stat.acu_used > 0 ? Math.min((stat.merged_prs / stat.acu_used) * 100, 100) * 20 : 0;
    const diversityWeight = Math.min(stat.categories.length * 10, 100) * 10;
    stat.ai_score = Math.round((mergedWeight + sessionWeight + acuEfficiency + diversityWeight) / 10);
  }

  store.devin_developer_stats = Array.from(devMap.values());

  // Aggregate per team
  const teamMap = new Map<string, DevinTeamStat>();
  for (const stat of store.devin_developer_stats) {
    const teamName = stat.team_name;
    let ts = teamMap.get(teamName);
    if (!ts) {
      ts = { team_name: teamName, sessions: 0, acu_used: 0, total_prs: 0, merged_prs: 0, developers: 0, ai_score: 0 };
      teamMap.set(teamName, ts);
    }
    ts.sessions += stat.sessions;
    ts.acu_used += stat.acu_used;
    ts.total_prs += stat.total_prs;
    ts.merged_prs += stat.merged_prs;
    ts.developers += 1;
    ts.ai_score += stat.ai_score;
  }
  for (const ts of teamMap.values()) {
    if (ts.developers > 0) ts.ai_score = Math.round(ts.ai_score / ts.developers);
  }

  store.devin_team_stats = Array.from(teamMap.values());
}

// GET /api/devin/stats
router.get('/stats', (_req, res) => {
  const sessions = store.devin_sessions;
  const total_prs = sessions.reduce((s, x) => s + x.pull_requests.length, 0);
  const merged_prs = sessions.reduce((s, x) => s + x.pull_requests.filter(p => p.pr_status === 'merged').length, 0);
  const unique_devs = new Set(sessions.map(s => s.user_email)).size;
  const total_acu = sessions.reduce((s, x) => s + x.acu_used, 0);
  res.json({
    total_sessions: sessions.length,
    active_developers: unique_devs,
    total_acu: Math.round(total_acu * 100) / 100,
    total_prs,
    merged_prs,
    ai_delivery_rate: total_prs > 0 ? Math.round((merged_prs / total_prs) * 100) : 0,
  });
});

// GET /api/devin/developers
router.get('/developers', (_req, res) => {
  const sorted = [...store.devin_developer_stats].sort((a, b) => b.ai_score - a.ai_score);
  res.json(sorted.map((d, i) => ({ ...d, rank: i + 1 })));
});

// GET /api/devin/teams
router.get('/teams', (_req, res) => {
  const sorted = [...store.devin_team_stats].sort((a, b) => b.ai_score - a.ai_score);
  res.json(sorted.map((t, i) => ({ ...t, rank: i + 1 })));
});

// GET /api/devin/trends
router.get('/trends', (_req, res) => {
  const byDate = new Map<string, number>();
  for (const s of store.devin_sessions) {
    const date = s.created_at.slice(0, 10);
    byDate.set(date, (byDate.get(date) || 0) + 1);
  }
  const sorted = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sessions]) => ({ date, sessions }));
  res.json(sorted);
});

// GET /api/devin/categories
router.get('/categories', (_req, res) => {
  const catMap = new Map<string, { category: string; subcategory: string | null; sessions: number; merged_prs: number; developers: Set<string> }>();
  for (const s of store.devin_sessions) {
    const key = s.category ?? 'uncategorized';
    let c = catMap.get(key);
    if (!c) {
      c = { category: key, subcategory: s.subcategory, sessions: 0, merged_prs: 0, developers: new Set() };
      catMap.set(key, c);
    }
    c.sessions += 1;
    c.developers.add(s.user_email);
    for (const pr of s.pull_requests) {
      if (pr.pr_status === 'merged') c.merged_prs += 1;
    }
  }
  res.json(Array.from(catMap.values()).map(c => ({ ...c, developers: c.developers.size })));
});

// POST /api/devin/upload
router.post('/upload', (req, res) => {
  const { team_name, sessions: rawSessions } = req.body as { team_name: string; sessions: any[] };

  if (!Array.isArray(rawSessions) || rawSessions.length === 0) {
    return res.status(400).json({ error: 'sessions array is required and must not be empty' });
  }

  const imported: DevinSession[] = rawSessions.map((s: any) => ({
    id: newId(),
    team_id: team_name || s.org_name || 'Unknown',
    user_name: s.user_name || '',
    user_email: s.user_email || '',
    session_name: s.session_name || '',
    created_at: s.created_at || new Date().toISOString(),
    acu_used: Number(s.acu_used) || 0,
    session_url: s.url || '',
    org_id: s.org_id || '',
    org_name: s.org_name || '',
    category: s.category || null,
    subcategory: s.subcategory || null,
    pull_requests: Array.isArray(s.pull_requests) ? s.pull_requests : [],
  }));

  store.devin_sessions.push(...imported);
  recomputeDevinStats();

  res.json({ imported: imported.length, total_sessions: store.devin_sessions.length });
});

export default router;
