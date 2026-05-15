import { store } from './db';

export function seed() {
  if (store.platforms.length > 0) return;

  const platforms = [
    { id: 1, name: 'GitHub Copilot', color: '#0078d4', icon: 'github' },
    { id: 2, name: 'Cursor', color: '#00b4d8', icon: 'cursor' },
    { id: 3, name: 'Claude', color: '#e07b39', icon: 'claude' },
    { id: 4, name: 'Devin', color: '#7c3aed', icon: 'devin' },
    { id: 5, name: 'Custom Tools', color: '#10b981', icon: 'tools' },
  ];
  store.platforms.push(...platforms);

  const teams = [
    { id: 1, name: 'Platform Team' },
    { id: 2, name: 'Backend Team' },
    { id: 3, name: 'Frontend Team' },
    { id: 4, name: 'DevOps Team' },
    { id: 5, name: 'QA Automation' },
  ];
  store.teams.push(...teams);

  store.developers.push(
    { id: 1, name: 'Rohit Sharma', avatar: 'RS', team_id: 1 },
    { id: 2, name: 'Anita Patel', avatar: 'AP', team_id: 2 },
    { id: 3, name: 'Sandeep Yadav', avatar: 'SY', team_id: 3 },
    { id: 4, name: 'Priya Verma', avatar: 'PV', team_id: 4 },
    { id: 5, name: 'Karan Singh', avatar: 'KS', team_id: 5 },
  );

  const dates = ['2025-05-12', '2025-05-13', '2025-05-14', '2025-05-15', '2025-05-16', '2025-05-17', '2025-05-18'];
  const statsData = [
    { pid: 1, data: [[320000,450000,8200],[290000,410000,7800],[350000,490000,8900],[380000,530000,9400],[410000,580000,10200],[440000,620000,11000],[460000,650000,11800]] },
    { pid: 2, data: [[180000,250000,4600],[160000,230000,4200],[200000,280000,5100],[220000,310000,5600],[240000,340000,6100],[260000,370000,6600],[280000,400000,7100]] },
    { pid: 3, data: [[120000,180000,3200],[110000,165000,2900],[135000,200000,3600],[150000,220000,4000],[165000,245000,4400],[180000,265000,4800],[190000,280000,5100]] },
    { pid: 4, data: [[80000,110000,2100],[75000,105000,1900],[90000,125000,2400],[100000,140000,2700],[110000,155000,3000],[120000,170000,3300],[130000,180000,3600]] },
    { pid: 5, data: [[60000,90000,1500],[55000,82000,1400],[68000,100000,1700],[75000,110000,1900],[82000,122000,2100],[90000,134000,2300],[95000,142000,2500]] },
  ];
  let statId = 1;
  statsData.forEach(s => s.data.forEach((d, i) => {
    store.daily_stats.push({ id: statId++, date: dates[i], platform_id: s.pid, requests: d[0], tokens: d[1], cost: d[2] });
  }));

  const promptsData = [
    ['Explain this code', 18245, 92, 1245],
    ['Write unit tests', 15672, 89, 2134],
    ['Refactor this code', 12398, 91, 1876],
    ['Debug issue', 11245, 85, 1567],
    ['Optimize performance', 9876, 88, 1345],
    ['Generate documentation', 8923, 94, 987],
    ['Code review', 7654, 87, 1432],
    ['Fix bug', 6789, 90, 1123],
  ];
  promptsData.forEach((p, i) => store.prompts.push({ id: i + 1, prompt_text: p[0] as string, uses: p[1] as number, success_rate: p[2] as number, avg_tokens: p[3] as number }));

  const scoresData = [
    [1, 92, 8], [2, 89, 5], [3, 87, 3], [4, 86, 6], [5, 84, 2],
  ];
  scoresData.forEach((s, i) => store.developer_scores.push({ id: i + 1, developer_id: s[0] as number, score: s[1] as number, trend: s[2] as number, period: 'May 12 - May 18' }));

  const teamCostsData = [
    [1, 54235, 24.6], [2, 42876, 18.7], [3, 28945, 20.1], [4, 26134, 15.3], [5, 18055, 19.8],
  ];
  teamCostsData.forEach((t, i) => store.team_costs.push({ id: i + 1, team_id: t[0] as number, cost: t[1] as number, change_pct: t[2] as number, period: 'May 12 - May 18' }));

  const modelCostsData = [
    ['GPT-4o', 58762, 31.6], ['Claude 3.5 Sonnet', 42138, 22.6], ['GPT-4 Turbo', 28945, 15.6],
    ['Claude 3 Haiku', 18456, 9.9], ['Gemini 1.5 Pro', 14235, 7.7],
  ];
  modelCostsData.forEach((m, i) => store.model_costs.push({ id: i + 1, model_name: m[0] as string, cost: m[1] as number, pct: m[2] as number, period: 'May 12 - May 18' }));

  const now = new Date();
  const activitiesData = [
    [1, 'Used Claude 3.5 Sonnet', 3, 2],
    [2, 'Used GPT-4o', 5, 3],
    [3, 'Used Cursor - Claude 3.5', 2, 5],
    [4, 'Used GitHub Copilot', 1, 6],
    [5, 'Used Devin AI', 4, 8],
  ];
  activitiesData.forEach((a, i) => {
    const t = new Date(now.getTime() - (a[3] as number) * 60000);
    store.live_activity.push({ id: i + 1, developer_id: a[0] as number, action: a[1] as string, platform_id: a[2] as number, created_at: t.toISOString() });
  });

  const wasteData = [
    ['efficiency', 'High token, low success prompts', 23, 'high'],
    ['redundancy', 'Repeated prompts', 156, 'medium'],
    ['cost', 'Overused expensive models', 14, 'high'],
    ['optimization', 'Inefficient long prompts', 31, 'low'],
  ];
  wasteData.forEach((w, i) => store.waste_items.push({ id: i + 1, category: w[0] as string, description: w[1] as string, count: w[2] as number, severity: w[3] as string }));

  const insightsData = [
    ['cost', 'Cost Optimization', 'Team Backend is spending 38% more than average.', 'dollar'],
    ['model', 'Model Recommendation', 'Use GPT-4o Mini for simple tasks to save $12,430', 'sparkles'],
    ['prompt', 'Prompt Optimization', 'Optimize 156 repeated prompts to save tokens', 'edit'],
    ['security', 'Security Alert', '3 prompts contain potential sensitive information', 'shield'],
    ['productivity', 'Productivity Boost', 'Developers saved 1,842 hours this week!', 'trending-up'],
  ];
  insightsData.forEach((ins, i) => store.insights.push({ id: i + 1, type: ins[0], title: ins[1], description: ins[2], icon: ins[3] }));

  console.log('[TokenTrek] Seed data loaded into memory.');
}
