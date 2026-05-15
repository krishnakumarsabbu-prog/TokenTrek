import { store } from './db';

// ─── helpers ────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isoOffset(msAgo: number): string {
  return new Date(Date.now() - msAgo).toISOString();
}

// Weighted random: weights must sum to 1
function weightedPick<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r < acc) return items[i];
  }
  return items[items.length - 1];
}

// ─── static reference data ───────────────────────────────────────────────────

const PLATFORMS = [
  { id: 1, name: 'GitHub Copilot', color: '#0078d4', icon: 'github' },
  { id: 2, name: 'Cursor',         color: '#00b4d8', icon: 'cursor' },
  { id: 3, name: 'Claude',         color: '#e07b39', icon: 'claude' },
  { id: 4, name: 'Devin',          color: '#2563eb', icon: 'devin' },
  { id: 5, name: 'Custom Tool',    color: '#10b981', icon: 'tools' },
];

const TEAMS = [
  { id: 1, name: 'Digital Notification' },
  { id: 2, name: 'IDPF' },
  { id: 3, name: 'SIMS' },
  { id: 4, name: 'CMS' },
];

// Core developer list (will be extended to cover 5000 records)
const CORE_DEVELOPERS = [
  { baseName: 'Krishna Sabbu', teamId: 1 },
  { baseName: 'Chandra',       teamId: 2 },
  { baseName: 'Padma',         teamId: 3 },
  { baseName: 'Ramya',         teamId: 4 },
  { baseName: 'Sarath',        teamId: 1 },
];

const MODELS = [
  'GPT-4o',
  'Claude 3.5 Sonnet',
  'GPT-4 Turbo',
  'Claude 3 Haiku',
  'Gemini 1.5 Pro',
  'GPT-4o Mini',
  'Claude 3 Opus',
  'Llama 3.1 70B',
];

const MODEL_WEIGHTS = [0.22, 0.20, 0.14, 0.12, 0.10, 0.09, 0.08, 0.05];

const PROJECTS = [
  'Auth Service', 'Notification Engine', 'Payment Gateway', 'User Portal',
  'Report Builder', 'Data Pipeline', 'API Gateway', 'Mobile Backend',
  'Admin Dashboard', 'Search Service', 'Workflow Automation', 'Compliance Tracker',
  'Identity Provider', 'Claims Management', 'Document Store', 'Event Bus',
];

const PROMPT_TEMPLATES = [
  'Explain this code snippet in {project}',
  'Write unit tests for {project} module',
  'Refactor this function in {project}',
  'Debug the issue in {project}',
  'Optimize performance of {project}',
  'Generate API documentation for {project}',
  'Review this pull request for {project}',
  'Fix the failing test in {project}',
  'Add error handling to {project} service',
  'Convert this class to TypeScript in {project}',
  'Create a migration script for {project}',
  'Implement retry logic for {project}',
  'Write integration test for {project}',
  'Summarize these requirements for {project}',
  'Generate mock data for {project} tests',
  'Improve logging in {project}',
  'Add input validation to {project}',
  'Translate Python to TypeScript for {project}',
  'Identify security vulnerabilities in {project}',
  'Create CI/CD pipeline config for {project}',
];

const ACTIONS = [
  'Used GitHub Copilot for autocomplete',
  'Generated unit tests with Claude',
  'Refactored service layer using Cursor',
  'Debugged runtime error with Devin',
  'Generated boilerplate with Custom Tool',
  'Code reviewed PR via Claude',
  'Wrote SQL migration using Copilot',
  'Resolved merge conflict with Cursor',
  'Explained complex regex using Claude',
  'Generated API client with Custom Tool',
  'Wrote Dockerfile with Copilot',
  'Fixed TypeScript errors using Devin',
  'Drafted release notes with Claude',
  'Scaffolded microservice with Cursor',
  'Generated test fixtures with Custom Tool',
];

const WASTE_CATEGORIES: Array<{ category: string; description: string; severity: 'high' | 'medium' | 'low' }> = [
  { category: 'efficiency',   description: 'High token, low success prompts',      severity: 'high'   },
  { category: 'redundancy',   description: 'Repeated identical prompts',            severity: 'medium' },
  { category: 'cost',         description: 'Overused expensive models for simple tasks', severity: 'high' },
  { category: 'optimization', description: 'Inefficient long prompts',              severity: 'low'    },
  { category: 'idle',         description: 'Sessions opened but never completed',   severity: 'medium' },
  { category: 'hallucination','description': 'Prompts with frequent re-asks',       severity: 'high'   },
];

const INSIGHT_TEMPLATES = [
  { type: 'cost',       title: 'Cost Optimization',    icon: 'dollar',      description: '{team} is spending {pct}% more than the weekly average.' },
  { type: 'model',      title: 'Model Recommendation', icon: 'sparkles',    description: 'Swap GPT-4o for GPT-4o Mini on simple tasks to save ${save}.' },
  { type: 'prompt',     title: 'Prompt Optimization',  icon: 'edit',        description: 'Consolidating {count} repeated prompts could save {tokens} tokens.' },
  { type: 'security',   title: 'Security Alert',       icon: 'shield',      description: '{count} prompts may contain sensitive data in {team}.' },
  { type: 'productivity', title: 'Productivity Boost', icon: 'trending-up', description: 'Developers saved {hours} hours this week using AI tools.' },
];

// ─── date helpers ─────────────────────────────────────────────────────────────

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// ─── main seed ────────────────────────────────────────────────────────────────

export function seed() {
  if (store.platforms.length > 0) return;

  // ── platforms ──
  store.platforms.push(...PLATFORMS);

  // ── teams ──
  store.teams.push(...TEAMS);

  // ── developers (50 to distribute 5000 records realistically) ──
  const developerPool: Array<{ id: number; name: string; avatar: string; team_id: number }> = [];

  // First, add the 5 named developers
  CORE_DEVELOPERS.forEach((d, i) => {
    const initials = d.baseName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    developerPool.push({ id: i + 1, name: d.baseName, avatar: initials, team_id: d.teamId });
  });

  // Extend to 50 developers cycling through teams for realistic distribution
  const extraFirstNames = [
    'Arjun', 'Divya', 'Vikram', 'Pooja', 'Rahul', 'Sneha', 'Aditya', 'Meera',
    'Kiran', 'Kavya', 'Suresh', 'Lakshmi', 'Ravi', 'Ananya', 'Mohan',
    'Priya', 'Sanjay', 'Nisha', 'Amit', 'Deepa', 'Gopal', 'Hema',
    'Ishaan', 'Jyothi', 'Karthik', 'Lalitha', 'Manish', 'Nandita',
    'Omkar', 'Pavan', 'Qasim', 'Rekha', 'Shiva', 'Tarini', 'Uday',
    'Vanitha', 'Wasim', 'Xena', 'Yashwant', 'Zara', 'Balaji', 'Chitra',
    'Darshan', 'Eswari', 'Farhan',
  ];
  const extraLastNames = [
    'Rao', 'Reddy', 'Kumar', 'Naidu', 'Sharma', 'Verma', 'Gupta', 'Patel',
    'Singh', 'Iyer', 'Pillai', 'Nair', 'Menon', 'Joshi', 'Desai',
  ];

  for (let i = 0; i < 45; i++) {
    const firstName = extraFirstNames[i % extraFirstNames.length];
    const lastName = extraLastNames[i % extraLastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`;
    const teamId = TEAMS[i % TEAMS.length].id;
    developerPool.push({ id: i + 6, name: fullName, avatar: initials, team_id: teamId });
  }

  store.developers.push(...developerPool);

  // ── daily_stats — 90 days × 5 platforms = 450 rows ──
  const dates = generateDateRange(90);
  // Base traffic per platform (requests, tokens, cost) — grows over time
  const platformBase = [
    { pid: 1, req: 320000, tok: 450000, cost: 8200 },
    { pid: 2, req: 180000, tok: 250000, cost: 4600 },
    { pid: 3, req: 120000, tok: 180000, cost: 3200 },
    { pid: 4, req:  80000, tok: 110000, cost: 2100 },
    { pid: 5, req:  60000, tok:  90000, cost: 1500 },
  ];

  let statId = 1;
  dates.forEach((date, dayIdx) => {
    const growthFactor = 1 + dayIdx * 0.008; // ~72% growth over 90 days
    platformBase.forEach(pb => {
      const weekendDip = [0, 6].includes(new Date(date).getDay()) ? 0.65 : 1;
      const noise = randFloat(0.88, 1.12);
      store.daily_stats.push({
        id: statId++,
        date,
        platform_id: pb.pid,
        requests: Math.round(pb.req * growthFactor * weekendDip * noise),
        tokens:   Math.round(pb.tok * growthFactor * weekendDip * noise),
        cost:     Math.round(pb.cost * growthFactor * weekendDip * noise),
      });
    });
  });

  // ── prompts — 300 realistic records ──
  let promptId = 1;
  for (let i = 0; i < 300; i++) {
    const template = PROMPT_TEMPLATES[i % PROMPT_TEMPLATES.length];
    const project = pick(PROJECTS);
    const text = template.replace('{project}', project);
    store.prompts.push({
      id: promptId++,
      prompt_text: text,
      uses: randInt(50, 25000),
      success_rate: randInt(72, 98),
      avg_tokens: randInt(400, 3500),
    });
  }

  // ── developer_scores — one score per developer ──
  developerPool.forEach((dev, i) => {
    store.developer_scores.push({
      id: i + 1,
      developer_id: dev.id,
      score: randInt(60, 99),
      trend: randInt(-10, 15),
      period: dates[dates.length - 7] + ' - ' + dates[dates.length - 1],
    });
  });

  // ── team_costs — one cost entry per team ──
  TEAMS.forEach((team, i) => {
    store.team_costs.push({
      id: i + 1,
      team_id: team.id,
      cost: randInt(15000, 80000),
      change_pct: randFloat(-5, 35),
      period: dates[dates.length - 7] + ' - ' + dates[dates.length - 1],
    });
  });

  // ── model_costs — one entry per model ──
  let totalModelCost = 0;
  const rawModelCosts = MODELS.map((name, i) => {
    const c = randInt(5000, 65000) * (MODEL_WEIGHTS[i] / MODEL_WEIGHTS[0]);
    totalModelCost += c;
    return { name, cost: Math.round(c) };
  });
  rawModelCosts.forEach((m, i) => {
    store.model_costs.push({
      id: i + 1,
      model_name: m.name,
      cost: m.cost,
      pct: parseFloat(((m.cost / totalModelCost) * 100).toFixed(1)),
      period: dates[dates.length - 7] + ' - ' + dates[dates.length - 1],
    });
  });

  // ── live_activity — 4200 records spread across last 30 days ──
  const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < 4200; i++) {
    const dev = developerPool[i % developerPool.length];
    const platform = weightedPick(PLATFORMS, [0.35, 0.25, 0.20, 0.10, 0.10]);
    const msAgo = randInt(0, MS_30_DAYS);
    store.live_activity.push({
      id: i + 1,
      developer_id: dev.id,
      action: pick(ACTIONS),
      platform_id: platform.id,
      created_at: isoOffset(msAgo),
    });
  }

  // ── waste_items — one entry per waste category with realistic counts ──
  WASTE_CATEGORIES.forEach((w, i) => {
    store.waste_items.push({
      id: i + 1,
      category: w.category,
      description: w.description,
      count: randInt(10, 250),
      severity: w.severity,
    });
  });

  // ── insights ──
  INSIGHT_TEMPLATES.forEach((tmpl, i) => {
    const team = pick(TEAMS).name;
    const description = tmpl.description
      .replace('{team}',   team)
      .replace('{pct}',    randInt(15, 45).toString())
      .replace('{save}',   randInt(5000, 20000).toLocaleString())
      .replace('{count}',  randInt(50, 300).toString())
      .replace('{tokens}', (randInt(100, 900) * 1000).toLocaleString())
      .replace('{hours}',  randInt(500, 3000).toLocaleString());

    store.insights.push({
      id: i + 1,
      type: tmpl.type,
      title: tmpl.title,
      description,
      icon: tmpl.icon,
    });
  });

  // ─── summary ──────────────────────────────────────────────────────────────
  const total =
    store.daily_stats.length +
    store.prompts.length +
    store.live_activity.length +
    store.developers.length +
    store.developer_scores.length +
    store.team_costs.length +
    store.model_costs.length +
    store.waste_items.length +
    store.insights.length;

  console.log(`[TokenTrek] Seed complete — ${total} records loaded into memory.`);
  console.log(`  platforms:         ${store.platforms.length}`);
  console.log(`  teams:             ${store.teams.length}`);
  console.log(`  developers:        ${store.developers.length}`);
  console.log(`  daily_stats:       ${store.daily_stats.length}`);
  console.log(`  prompts:           ${store.prompts.length}`);
  console.log(`  developer_scores:  ${store.developer_scores.length}`);
  console.log(`  team_costs:        ${store.team_costs.length}`);
  console.log(`  model_costs:       ${store.model_costs.length}`);
  console.log(`  live_activity:     ${store.live_activity.length}`);
  console.log(`  waste_items:       ${store.waste_items.length}`);
  console.log(`  insights:          ${store.insights.length}`);
}
