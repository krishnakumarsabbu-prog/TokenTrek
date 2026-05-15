import { getDb } from './db';

export function seed() {
  const db = getDb();

  const platformCount = (db.prepare('SELECT COUNT(*) as c FROM platforms').get() as { c: number }).c;
  if (platformCount > 0) return;

  const platforms = [
    { name: 'GitHub Copilot', color: '#0078d4', icon: 'github' },
    { name: 'Cursor', color: '#00b4d8', icon: 'cursor' },
    { name: 'Claude', color: '#e07b39', icon: 'claude' },
    { name: 'Devin', color: '#7c3aed', icon: 'devin' },
    { name: 'Custom Tools', color: '#10b981', icon: 'tools' },
  ];
  const insertPlatform = db.prepare('INSERT INTO platforms (name, color, icon) VALUES (?, ?, ?)');
  platforms.forEach(p => insertPlatform.run(p.name, p.color, p.icon));

  const teams = ['Platform Team', 'Backend Team', 'Frontend Team', 'DevOps Team', 'QA Automation'];
  const insertTeam = db.prepare('INSERT INTO teams (name) VALUES (?)');
  teams.forEach(t => insertTeam.run(t));

  const devs = [
    { name: 'Rohit Sharma', avatar: 'RS', team: 'Platform Team' },
    { name: 'Anita Patel', avatar: 'AP', team: 'Backend Team' },
    { name: 'Sandeep Yadav', avatar: 'SY', team: 'Frontend Team' },
    { name: 'Priya Verma', avatar: 'PV', team: 'DevOps Team' },
    { name: 'Karan Singh', avatar: 'KS', team: 'QA Automation' },
  ];
  const insertDev = db.prepare(
    'INSERT INTO developers (name, avatar, team_id) VALUES (?, ?, (SELECT id FROM teams WHERE name = ?))'
  );
  devs.forEach(d => insertDev.run(d.name, d.avatar, d.team));

  const dates = ['2025-05-12', '2025-05-13', '2025-05-14', '2025-05-15', '2025-05-16', '2025-05-17', '2025-05-18'];
  const statsData = [
    { p: 'GitHub Copilot', data: [[320000,450000,8200],[290000,410000,7800],[350000,490000,8900],[380000,530000,9400],[410000,580000,10200],[440000,620000,11000],[460000,650000,11800]] },
    { p: 'Cursor',         data: [[180000,250000,4600],[160000,230000,4200],[200000,280000,5100],[220000,310000,5600],[240000,340000,6100],[260000,370000,6600],[280000,400000,7100]] },
    { p: 'Claude',         data: [[120000,180000,3200],[110000,165000,2900],[135000,200000,3600],[150000,220000,4000],[165000,245000,4400],[180000,265000,4800],[190000,280000,5100]] },
    { p: 'Devin',          data: [[80000,110000,2100],[75000,105000,1900],[90000,125000,2400],[100000,140000,2700],[110000,155000,3000],[120000,170000,3300],[130000,180000,3600]] },
    { p: 'Custom Tools',   data: [[60000,90000,1500],[55000,82000,1400],[68000,100000,1700],[75000,110000,1900],[82000,122000,2100],[90000,134000,2300],[95000,142000,2500]] },
  ];
  const insertStats = db.prepare(
    'INSERT INTO daily_stats (date, platform_id, requests, tokens, cost) VALUES (?, (SELECT id FROM platforms WHERE name = ?), ?, ?, ?)'
  );
  statsData.forEach(s => s.data.forEach((d, i) => insertStats.run(dates[i], s.p, d[0], d[1], d[2])));

  const prompts = [
    ['Explain this code', 18245, 92, 1245],
    ['Write unit tests', 15672, 89, 2134],
    ['Refactor this code', 12398, 91, 1876],
    ['Debug issue', 11245, 85, 1567],
    ['Optimize performance', 9876, 88, 1345],
    ['Generate documentation', 8923, 94, 987],
    ['Code review', 7654, 87, 1432],
    ['Fix bug', 6789, 90, 1123],
  ];
  const insertPrompt = db.prepare('INSERT INTO prompts (prompt_text, uses, success_rate, avg_tokens) VALUES (?, ?, ?, ?)');
  prompts.forEach(p => insertPrompt.run(p[0], p[1], p[2], p[3]));

  const scores = [
    ['Rohit Sharma', 92, 8], ['Anita Patel', 89, 5], ['Sandeep Yadav', 87, 3],
    ['Priya Verma', 86, 6], ['Karan Singh', 84, 2],
  ];
  const insertScore = db.prepare(
    'INSERT INTO developer_scores (developer_id, score, trend, period) VALUES ((SELECT id FROM developers WHERE name = ?), ?, ?, ?)'
  );
  scores.forEach(s => insertScore.run(s[0], s[1], s[2], 'May 12 - May 18'));

  const teamCosts = [
    ['Platform Team', 54235, 24.6], ['Backend Team', 42876, 18.7], ['Frontend Team', 28945, 20.1],
    ['DevOps Team', 26134, 15.3], ['QA Automation', 18055, 19.8],
  ];
  const insertTeamCost = db.prepare(
    'INSERT INTO team_costs (team_id, cost, change_pct, period) VALUES ((SELECT id FROM teams WHERE name = ?), ?, ?, ?)'
  );
  teamCosts.forEach(t => insertTeamCost.run(t[0], t[1], t[2], 'May 12 - May 18'));

  const modelCosts = [
    ['GPT-4o', 58762, 31.6], ['Claude 3.5 Sonnet', 42138, 22.6], ['GPT-4 Turbo', 28945, 15.6],
    ['Claude 3 Haiku', 18456, 9.9], ['Gemini 1.5 Pro', 14235, 7.7],
  ];
  const insertModel = db.prepare('INSERT INTO model_costs (model_name, cost, pct, period) VALUES (?, ?, ?, ?)');
  modelCosts.forEach(m => insertModel.run(m[0], m[1], m[2], 'May 12 - May 18'));

  const activities = [
    ['Rohit Sharma', 'Used Claude 3.5 Sonnet', 'Claude', '-2'],
    ['Anita Patel', 'Used GPT-4o', 'Custom Tools', '-3'],
    ['Sandeep Yadav', 'Used Cursor - Claude 3.5', 'Cursor', '-5'],
    ['Priya Verma', 'Used GitHub Copilot', 'GitHub Copilot', '-6'],
    ['Karan Singh', 'Used Devin AI', 'Devin', '-8'],
  ];
  const insertActivity = db.prepare(
    `INSERT INTO live_activity (developer_id, action, platform_id, created_at)
     VALUES ((SELECT id FROM developers WHERE name = ?), ?, (SELECT id FROM platforms WHERE name = ?), datetime('now', ? || ' minutes'))`
  );
  activities.forEach(a => insertActivity.run(a[0], a[1], a[2], a[3]));

  const waste = [
    ['efficiency', 'High token, low success prompts', 23, 'high'],
    ['redundancy', 'Repeated prompts', 156, 'medium'],
    ['cost', 'Overused expensive models', 14, 'high'],
    ['optimization', 'Inefficient long prompts', 31, 'low'],
  ];
  const insertWaste = db.prepare('INSERT INTO waste_items (category, description, count, severity) VALUES (?, ?, ?, ?)');
  waste.forEach(w => insertWaste.run(w[0], w[1], w[2], w[3]));

  const insights = [
    ['cost', 'Cost Optimization', 'Team Backend is spending 38% more than average.', 'dollar'],
    ['model', 'Model Recommendation', 'Use GPT-4o Mini for simple tasks to save $12,430', 'sparkles'],
    ['prompt', 'Prompt Optimization', 'Optimize 156 repeated prompts to save tokens', 'edit'],
    ['security', 'Security Alert', '3 prompts contain potential sensitive information', 'shield'],
    ['productivity', 'Productivity Boost', 'Developers saved 1,842 hours this week!', 'trending-up'],
  ];
  const insertInsight = db.prepare('INSERT INTO insights (type, title, description, icon) VALUES (?, ?, ?, ?)');
  insights.forEach(i => insertInsight.run(i[0], i[1], i[2], i[3]));

  console.log('[TokenTrek] Seed data inserted.');
}
