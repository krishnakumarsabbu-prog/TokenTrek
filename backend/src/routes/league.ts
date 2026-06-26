import { Router } from 'express';
import { store } from '../db';
import { computeUnifiedDeveloperScores, computeUnifiedTeamScores } from '../scoringEngine';

const router = Router();

router.get('/developer-leaderboard', (_req, res) => {
  res.json(computeUnifiedDeveloperScores());
});

// GET /api/league/developer/:name — detail for a single developer
router.get('/developer/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const allDevs = computeUnifiedDeveloperScores();
  const dev = allDevs.find(d => d.name === name);
  if (!dev) return res.status(404).json({ error: 'Developer not found' });

  // Pull Devin data if available
  const devinStat = store.devin_developer_stats.find(
    d => d.user_name === name || d.user_email.includes(name.toLowerCase().replace(' ', '.'))
  );

  const dbDev = store.developers.find(d => d.name === name);
  const devScoreEntry = dbDev ? store.developer_scores.find(ds => ds.developer_id === dbDev.id) : null;
  const teamEntry = dbDev ? store.teams.find(t => t.id === dbDev.team_id) : null;

  const devSessions = devinStat
    ? store.devin_sessions.filter(s => s.user_name === name || (devinStat && s.user_email === devinStat.user_email))
    : [];

  const sessionTimeline = devSessions
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20)
    .map(s => ({
      id: s.id,
      date: s.created_at.slice(0, 10),
      session_name: s.session_name,
      acu_used: s.acu_used,
      prs: s.pull_requests.length,
      merged_prs: s.pull_requests.filter(p => p.pr_status === 'merged').length,
      category: s.category,
      session_url: s.session_url,
    }));

  const catMap = new Map<string, number>();
  for (const s of devSessions) {
    const cat = s.category || 'uncategorized';
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  }
  const categories = Array.from(catMap.entries()).map(([cat, count]) => ({ category: cat, count }));

  res.json({
    ...dev,
    team: teamEntry?.name || dev.team,
    devin: devinStat ? {
      sessions: devinStat.sessions,
      acu_used: devinStat.acu_used,
      total_prs: devinStat.total_prs,
      merged_prs: devinStat.merged_prs,
      open_prs: devinStat.open_prs,
      failed_prs: devinStat.failed_prs,
      ai_score: devinStat.ai_score,
      categories: devinStat.categories,
    } : null,
    sessionTimeline,
    categories,
    score: devScoreEntry?.score ?? dev.totalScore,
    trend: devScoreEntry?.trend ?? dev.weeklyChange,
  });
});

router.get('/team-leaderboard', (_req, res) => {
  res.json(computeUnifiedTeamScores());
});

// GET /api/league/team/:name — detail for a single team
router.get('/team/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const allTeams = computeUnifiedTeamScores();
  const team = allTeams.find(t => t.name === name);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const dbTeam = store.teams.find(t => t.name === name);
  const members = dbTeam
    ? store.developers.filter(d => d.team_id === dbTeam.id)
    : [];

  const allDevs = computeUnifiedDeveloperScores();
  const memberProfiles = members.map(m => {
    const devScore = allDevs.find(d => d.name === m.name);
    const devinStat = store.devin_developer_stats.find(d => d.user_name === m.name);
    return {
      name: m.name,
      avatar: m.avatar,
      totalScore: devScore?.totalScore ?? 0,
      tokenEfficiency: devScore?.tokenEfficiency ?? 0,
      promptSuccessRate: devScore?.promptSuccessRate ?? 0,
      costSaved: devScore?.costSaved ?? 0,
      weeklyChange: devScore?.weeklyChange ?? 0,
      devin_sessions: devinStat?.sessions ?? 0,
      devin_merged_prs: devinStat?.merged_prs ?? 0,
      devin_ai_score: devinStat?.ai_score ?? 0,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const devinTeam = store.devin_team_stats.find(dt =>
    dt.team_name.toLowerCase() === name.toLowerCase()
  );

  res.json({
    ...team,
    members: memberProfiles,
    devin: devinTeam ? {
      sessions: devinTeam.sessions,
      acu_used: devinTeam.acu_used,
      total_prs: devinTeam.total_prs,
      merged_prs: devinTeam.merged_prs,
      developers: devinTeam.developers,
      ai_score: devinTeam.ai_score,
    } : null,
  });
});

router.get('/champions', (_req, res) => {
  const devs = computeUnifiedDeveloperScores();
  const teams = computeUnifiedTeamScores();

  if (devs.length === 0 || teams.length === 0) {
    return res.json({
      weekly: { developer: null, team: null },
      monthly: { developer: null, team: null },
      special: { bestPromptCreator: null, highestCostSaver: null, topAIAdopter: null },
    });
  }

  const weeklyDevChamp = devs[0];
  const monthlyDevChamp = devs[1] ? { ...devs[1], totalScore: devs[1].totalScore + 2 } : devs[0];
  const weeklyTeamChamp = teams[0];
  const monthlyTeamChamp = teams[1] ? { ...teams[1], totalScore: teams[1].totalScore + 1 } : teams[0];

  const bestPromptCreator = [...devs].sort((a, b) => b.promptsCreated - a.promptsCreated)[0];
  const highestCostSaver  = [...devs].sort((a, b) => b.costSaved - a.costSaved)[0];
  const topAIAdopter      = [...devs].sort((a, b) => b.adoptionScore - a.adoptionScore)[0];

  res.json({
    weekly:  { developer: weeklyDevChamp, team: weeklyTeamChamp },
    monthly: { developer: monthlyDevChamp, team: monthlyTeamChamp },
    special: { bestPromptCreator, highestCostSaver, topAIAdopter },
  });
});

export default router;
