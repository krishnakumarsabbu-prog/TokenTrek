import { store } from './db';

// ─── Totals ────────────────────────────────────────────────────────────────

export function computeTotals() {
  const totalRequests = store.daily_stats.reduce((s, r) => s + r.requests, 0);
  const totalTokens   = store.daily_stats.reduce((s, r) => s + r.tokens, 0);
  const totalCost     = store.daily_stats.reduce((s, r) => s + r.cost, 0);
  return { totalRequests, totalTokens, totalCost };
}

// ─── Daily Usage ───────────────────────────────────────────────────────────

export function computeDailyUsage() {
  const byDate: Record<string, { requests: number; tokens: number; cost: number }> = {};
  for (const r of store.daily_stats) {
    if (!byDate[r.date]) byDate[r.date] = { requests: 0, tokens: 0, cost: 0 };
    byDate[r.date].requests += r.requests;
    byDate[r.date].tokens   += r.tokens;
    byDate[r.date].cost     += r.cost;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d }));
}

// ─── Platform Usage ────────────────────────────────────────────────────────

export function computePlatformUsage() {
  const byPlatform: Record<number, { requests: number; tokens: number; cost: number }> = {};
  for (const r of store.daily_stats) {
    if (!byPlatform[r.platform_id]) byPlatform[r.platform_id] = { requests: 0, tokens: 0, cost: 0 };
    byPlatform[r.platform_id].requests += r.requests;
    byPlatform[r.platform_id].tokens   += r.tokens;
    byPlatform[r.platform_id].cost     += r.cost;
  }
  const totalCost = Object.values(byPlatform).reduce((s, v) => s + v.cost, 0);
  return Object.entries(byPlatform)
    .map(([pid, d]) => {
      const platform = store.platforms.find(p => p.id === Number(pid));
      return {
        platform_id: Number(pid),
        name: platform?.name ?? '',
        color: platform?.color ?? '',
        icon: platform?.icon ?? '',
        requests: d.requests,
        tokens: d.tokens,
        cost: d.cost,
        costPct: totalCost > 0 ? Math.round((d.cost / totalCost) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

// ─── Developer Scores ──────────────────────────────────────────────────────

export function computeDeveloperScores() {
  return store.developer_scores
    .map(ds => {
      const dev = store.developers.find(d => d.id === ds.developer_id);
      const team = store.teams.find(t => t.id === dev?.team_id);
      return {
        developer_id: ds.developer_id,
        developer: dev?.name ?? '',
        avatar: dev?.avatar ?? '',
        team: team?.name ?? '',
        score: ds.score,
        trend: ds.trend,
        period: ds.period,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Prompt Ranking ────────────────────────────────────────────────────────

export function computePromptRanking() {
  // Composite rank: weighted mix of usage, success rate, token efficiency
  return store.prompts
    .map(p => {
      const tokenEfficiency = p.uses > 0 ? p.success_rate / p.avg_tokens : 0;
      // Higher usage + higher success + lower avg_tokens = better rank score
      const rankScore = p.uses * (p.success_rate / 100) * (1000 / Math.max(p.avg_tokens, 1));
      return {
        id: p.id,
        prompt: p.prompt_text,
        uses: p.uses,
        successRate: p.success_rate,
        avgTokens: p.avg_tokens,
        tokenEfficiency: Math.round(tokenEfficiency * 1000) / 1000,
        rankScore: Math.round(rankScore),
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
}

// ─── Team Ranking ──────────────────────────────────────────────────────────

export function computeTeamRanking() {
  const totalCost = store.team_costs.reduce((s, t) => s + t.cost, 0);
  return store.team_costs
    .map(tc => {
      const team = store.teams.find(t => t.id === tc.team_id);
      return {
        team_id: tc.team_id,
        team: team?.name ?? '',
        cost: tc.cost,
        changePct: tc.change_pct,
        costShare: totalCost > 0 ? Math.round((tc.cost / totalCost) * 1000) / 10 : 0,
        period: tc.period,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

// ─── Model Efficiency ──────────────────────────────────────────────────────

export function computeModelEfficiency() {
  const totalCost = store.model_costs.reduce((s, m) => s + m.cost, 0);
  return store.model_costs
    .map(m => {
      // Cost per percentage point of coverage — lower is more efficient
      const efficiencyScore = m.pct > 0 ? m.cost / m.pct : Infinity;
      return {
        model: m.model_name,
        cost: m.cost,
        costPct: m.pct,
        costShare: totalCost > 0 ? Math.round((m.cost / totalCost) * 1000) / 10 : 0,
        efficiencyScore: Math.round(efficiencyScore),
        period: m.period,
        // Classify efficiency tier
        tier: efficiencyScore < 1500 ? 'high' : efficiencyScore < 3000 ? 'medium' : 'low',
      };
    })
    .sort((a, b) => a.efficiencyScore - b.efficiencyScore);
}

// ─── AI Waste ──────────────────────────────────────────────────────────────

export function computeAIWaste() {
  const totalOccurrences = store.waste_items.reduce((s, w) => s + w.count, 0);

  // Estimate token cost per occurrence by severity
  const costPerOccurrence: Record<string, number> = { high: 120, medium: 40, low: 10 };

  const items = store.waste_items.map(w => {
    const estimatedCost = w.count * (costPerOccurrence[w.severity] ?? 20);
    return {
      id: w.id,
      category: w.category,
      description: w.description,
      occurrences: w.count,
      severity: w.severity,
      estimatedCost,
      occurrencePct: totalOccurrences > 0 ? Math.round((w.count / totalOccurrences) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.estimatedCost - a.estimatedCost);

  const totalEstimatedWasteCost = items.reduce((s, i) => s + i.estimatedCost, 0);
  const highSeverityCount = items.filter(i => i.severity === 'high').reduce((s, i) => s + i.occurrences, 0);

  return {
    totalOccurrences,
    totalEstimatedWasteCost,
    highSeverityCount,
    items,
  };
}

// ─── Recommendations ───────────────────────────────────────────────────────

export function computeRecommendations() {
  const recommendations: {
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    estimatedSavings?: number;
    action: string;
  }[] = [];

  const { totalCost } = computeTotals();
  const modelEff = computeModelEfficiency();
  const waste = computeAIWaste();
  const teamRanking = computeTeamRanking();
  const promptRanking = computePromptRanking();

  // 1. Model cost optimization
  const lowEffModels = modelEff.filter(m => m.tier === 'low');
  if (lowEffModels.length > 0) {
    const potentialSavings = lowEffModels.reduce((s, m) => s + m.cost * 0.3, 0);
    recommendations.push({
      id: 'model-efficiency',
      priority: 'high',
      category: 'cost',
      title: 'Switch low-efficiency models to cheaper alternatives',
      description: `${lowEffModels.map(m => m.model).join(', ')} show low cost-efficiency. Consider replacing with smaller models for routine tasks.`,
      estimatedSavings: Math.round(potentialSavings),
      action: 'Review model selection policy and add tiered routing rules.',
    });
  }

  // 2. High-waste items
  if (waste.highSeverityCount > 0) {
    recommendations.push({
      id: 'waste-reduction',
      priority: 'critical',
      category: 'efficiency',
      title: 'Eliminate high-severity AI waste',
      description: `${waste.highSeverityCount} high-severity waste occurrences detected (estimated cost: $${waste.totalEstimatedWasteCost.toLocaleString()}).`,
      estimatedSavings: Math.round(waste.totalEstimatedWasteCost * 0.7),
      action: 'Audit and optimize prompts flagged under high-severity waste categories.',
    });
  }

  // 3. Team budget overspend — flag teams with positive change %
  const overspendingTeams = teamRanking.filter(t => t.changePct > 20);
  if (overspendingTeams.length > 0) {
    const totalOverspend = overspendingTeams.reduce((s, t) => s + t.cost * (t.changePct / 100), 0);
    recommendations.push({
      id: 'team-budget',
      priority: 'high',
      category: 'budget',
      title: 'Rein in overspending teams',
      description: `${overspendingTeams.map(t => t.team).join(', ')} exceeded budget by >20%. Total overrun: $${Math.round(totalOverspend).toLocaleString()}.`,
      estimatedSavings: Math.round(totalOverspend * 0.5),
      action: 'Set per-team token quotas and enable budget alerts.',
    });
  }

  // 4. Repeated / low-ranked prompts
  const lowRankedPrompts = promptRanking.filter(p => p.successRate < 88);
  if (lowRankedPrompts.length > 0) {
    recommendations.push({
      id: 'prompt-quality',
      priority: 'medium',
      category: 'prompts',
      title: 'Improve low-success prompts',
      description: `${lowRankedPrompts.length} prompts have a success rate below 88%. Improving them reduces retries and wasted tokens.`,
      estimatedSavings: Math.round(totalCost * 0.05),
      action: 'Add prompt templates and review failed prompt patterns.',
    });
  }

  // 5. Token volume growth
  const dailyUsage = computeDailyUsage();
  if (dailyUsage.length >= 2) {
    const first = dailyUsage[0].tokens;
    const last  = dailyUsage[dailyUsage.length - 1].tokens;
    const growthPct = first > 0 ? ((last - first) / first) * 100 : 0;
    if (growthPct > 25) {
      recommendations.push({
        id: 'token-growth',
        priority: 'medium',
        category: 'scaling',
        title: 'Token consumption growing rapidly',
        description: `Daily token usage grew ${Math.round(growthPct)}% over the tracked period. Review usage patterns before costs accelerate.`,
        action: 'Implement token budgets per developer and enable real-time alerts.',
      });
    }
  }

  // 6. Low developer scores
  const scores = computeDeveloperScores();
  const lowScorers = scores.filter(d => d.score < 85);
  if (lowScorers.length > 0) {
    recommendations.push({
      id: 'developer-training',
      priority: 'low',
      category: 'productivity',
      title: 'Support low-scoring developers',
      description: `${lowScorers.map(d => d.developer).join(', ')} have AI productivity scores below 85. Training may improve efficiency.`,
      action: 'Schedule AI tooling workshops and share best-practice prompt guides.',
    });
  }

  return recommendations.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

// ─── Developer XP System ──────────────────────────────────────────────────

const XP_LEVELS = [
  { name: 'Beginner',     minXp: 0,    maxXp: 999,   color: '#8ba3be', badge: '🌱' },
  { name: 'Explorer',     minXp: 1000, maxXp: 2999,  color: '#10b981', badge: '🔍' },
  { name: 'Prompt Ninja', minXp: 3000, maxXp: 5999,  color: '#0078d4', badge: '⚡' },
  { name: 'Token Master', minXp: 6000, maxXp: 9999,  color: '#d97706', badge: '🔥' },
  { name: 'AI Champion',  minXp: 10000, maxXp: Infinity, color: '#e07b39', badge: '🏆' },
];

function getLevel(xp: number) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXp) return { ...XP_LEVELS[i], index: i };
  }
  return { ...XP_LEVELS[0], index: 0 };
}

export function computeDeveloperXP() {
  // Deterministic seeded random to get stable per-developer numbers
  function seededRand(seed: number, min: number, max: number): number {
    const x = Math.sin(seed) * 10000;
    const frac = x - Math.floor(x);
    return Math.floor(frac * (max - min + 1)) + min;
  }

  const developerXP = store.developers.map((dev, idx) => {
    const score = store.developer_scores.find(ds => ds.developer_id === dev.id);
    const team  = store.teams.find(t => t.id === dev.team_id);

    const seed = dev.id * 137 + 42;
    // Activity counts derived deterministically from dev index
    const promptsUsed        = seededRand(seed,       80,  1200);
    const successfulPrompts  = Math.round(promptsUsed * (seededRand(seed + 1, 70, 98) / 100));
    const acceptedCodeBlocks = seededRand(seed + 2,   30,   600);
    const timeSavedHrs       = seededRand(seed + 3,   20,   350);
    const aiEfficiency       = seededRand(seed + 4,   55,    99);

    // XP calculation
    const baseXP       = (score?.score ?? 70) * 40;
    const promptXP     = successfulPrompts * 3;
    const codeXP       = acceptedCodeBlocks * 8;
    const efficiencyXP = Math.round(aiEfficiency * 12);
    const timeXP       = timeSavedHrs * 5;
    const totalXP      = baseXP + promptXP + codeXP + efficiencyXP + timeXP;

    const level    = getLevel(totalXP);
    const nextLevel = XP_LEVELS[Math.min(level.index + 1, XP_LEVELS.length - 1)];
    const xpForNext = nextLevel.minXp;
    const xpProgress = level.index === XP_LEVELS.length - 1
      ? 100
      : Math.round(((totalXP - level.minXp) / (nextLevel.minXp - level.minXp)) * 100);

    // Estimated ROI: time saved * avg hourly dev rate ($120)
    const estimatedROI = timeSavedHrs * 120;

    // Overall rank among all devs (assigned after sort)
    return {
      developer_id:     dev.id,
      developer:        dev.name,
      avatar:           dev.avatar,
      team:             team?.name ?? '',
      xp:               totalXP,
      xpProgress:       Math.min(xpProgress, 100),
      level:            level.name,
      levelColor:       level.color,
      levelIndex:       level.index,
      score:            score?.score ?? 70,
      trend:            score?.trend ?? 0,
      aiEfficiency,
      promptsUsed,
      successfulPrompts,
      acceptedCode:     acceptedCodeBlocks,
      timeSavedHrs,
      estimatedROI,
      rank:             0, // filled below
    };
  });

  // Sort by XP descending, assign rank
  developerXP.sort((a, b) => b.xp - a.xp);
  developerXP.forEach((d, i) => { d.rank = i + 1; });

  return developerXP;
}

// ─── AI Insights Panel ────────────────────────────────────────────────────────

export type InsightCategory =
  | 'recommendation'
  | 'unusual_usage'
  | 'cost_anomaly'
  | 'prompt_opportunity'
  | 'model_switch'
  | 'weekly_trend'
  | 'hidden';

export interface AIInsight {
  id: string;
  category: InsightCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  delta?: number;
  savings?: number;
  action?: string;
  tags?: string[];
}

export function computeAIInsights(): AIInsight[] {
  const insights: AIInsight[] = [];

  const { totalCost } = computeTotals();
  const platformUsage = computePlatformUsage();
  const teamRanking = computeTeamRanking();
  const modelEff = computeModelEfficiency();
  const waste = computeAIWaste();
  const promptRanking = computePromptRanking();
  const devScores = computeDeveloperScores();
  const dailyUsage = computeDailyUsage();

  // ── Recommendations ─────────────────────────────────────────────────────────

  // Top-spending team with high growth
  const topTeam = teamRanking[0];
  if (topTeam && topTeam.changePct > 15) {
    const saving = Math.round(topTeam.cost * 0.18);
    insights.push({
      id: 'rec-team-minimodel',
      category: 'recommendation',
      priority: 'high',
      title: `${topTeam.team} could save 18% with GPT-4o Mini`,
      description: `${topTeam.team} is your highest-spending team at $${topTeam.cost.toLocaleString()} (+${topTeam.changePct.toFixed(1)}%). Routing simple tasks to GPT-4o Mini would cut costs significantly.`,
      metric: `$${saving.toLocaleString()}`,
      metricLabel: 'potential savings',
      savings: saving,
      delta: -18,
      action: 'Configure model routing policy',
      tags: ['cost', 'model-routing'],
    });
  }

  // Platform with best success scores
  const cursorPlatform = platformUsage.find(p => p.name === 'Cursor');
  const githubPlatform = platformUsage.find(p => p.name === 'GitHub Copilot');
  if (cursorPlatform && githubPlatform) {
    const cursorDevs = store.developers.filter(d =>
      store.live_activity.some(la => la.developer_id === d.id && la.platform_id === cursorPlatform.platform_id)
    );
    const cursorDevScores = devScores.filter(ds =>
      cursorDevs.some(cd => cd.name === ds.developer)
    );
    const avgCursorScore = cursorDevScores.length
      ? Math.round(cursorDevScores.reduce((s, d) => s + d.score, 0) / cursorDevScores.length)
      : 0;
    if (avgCursorScore > 80) {
      insights.push({
        id: 'rec-cursor-success',
        category: 'recommendation',
        priority: 'medium',
        title: 'Cursor users have highest prompt success',
        description: `Developers using Cursor average a ${avgCursorScore}% productivity score — the highest across all platforms. Consider expanding Cursor licenses to lower-scoring teams.`,
        metric: `${avgCursorScore}%`,
        metricLabel: 'avg score',
        action: 'Expand Cursor to underperforming teams',
        tags: ['productivity', 'platform'],
      });
    }
  }

  // ── Unusual Usage ───────────────────────────────────────────────────────────

  // Detect repeated prompts
  const highUsePrompts = promptRanking.filter(p => p.uses > 200);
  if (highUsePrompts.length > 0) {
    const topRepeat = highUsePrompts[0];
    insights.push({
      id: 'unusual-repeated-prompt',
      category: 'unusual_usage',
      priority: 'high',
      title: `Repeated prompt detected ${topRepeat.uses.toLocaleString()} times`,
      description: `"${topRepeat.prompt.slice(0, 60)}…" has been used ${topRepeat.uses.toLocaleString()} times. Consolidating into a shared template could save significant tokens.`,
      metric: topRepeat.uses.toLocaleString(),
      metricLabel: 'occurrences',
      savings: Math.round(topRepeat.uses * topRepeat.avgTokens * 0.000002 * 0.4),
      action: 'Add to Prompt Marketplace',
      tags: ['prompts', 'efficiency'],
    });
  }

  // Weekend usage spike detection
  const weekendStats = store.daily_stats.filter(s => [0, 6].includes(new Date(s.date).getDay()));
  const weekdayStats = store.daily_stats.filter(s => ![0, 6].includes(new Date(s.date).getDay()));
  const avgWeekendCost = weekendStats.length
    ? weekendStats.reduce((s, r) => s + r.cost, 0) / weekendStats.length
    : 0;
  const avgWeekdayCost = weekdayStats.length
    ? weekdayStats.reduce((s, r) => s + r.cost, 0) / weekdayStats.length
    : 0;
  const weekendRatio = avgWeekdayCost > 0 ? (avgWeekendCost / avgWeekdayCost) * 100 : 0;
  if (weekendRatio > 55) {
    insights.push({
      id: 'unusual-weekend-usage',
      category: 'unusual_usage',
      priority: 'medium',
      title: 'High weekend AI usage detected',
      description: `Weekend usage is ${weekendRatio.toFixed(0)}% of weekday levels — unusually high. This may indicate automated jobs or policy gaps for off-hours usage.`,
      metric: `${weekendRatio.toFixed(0)}%`,
      metricLabel: 'of weekday avg',
      action: 'Review off-hours usage policy',
      tags: ['usage', 'anomaly'],
    });
  }

  // ── Cost Anomalies ──────────────────────────────────────────────────────────

  // Team with biggest cost surge
  const surgingTeams = teamRanking.filter(t => t.changePct > 25);
  surgingTeams.slice(0, 2).forEach((t, i) => {
    const overspend = Math.round(t.cost * (t.changePct / 100));
    insights.push({
      id: `cost-surge-${i}`,
      category: 'cost_anomaly',
      priority: t.changePct > 35 ? 'critical' : 'high',
      title: `${t.team} cost up ${t.changePct.toFixed(1)}% this week`,
      description: `${t.team} spent $${t.cost.toLocaleString()} — $${overspend.toLocaleString()} over the expected baseline. No budget alert was triggered.`,
      metric: `+$${overspend.toLocaleString()}`,
      metricLabel: 'over baseline',
      delta: t.changePct,
      action: 'Set budget alert for this team',
      tags: ['cost', 'budget'],
    });
  });

  // Low-efficiency model cost anomaly
  const lowEff = modelEff.filter(m => m.tier === 'low');
  if (lowEff.length > 0) {
    const wasteCost = lowEff.reduce((s, m) => s + m.cost, 0);
    const saving = Math.round(wasteCost * 0.3);
    insights.push({
      id: 'cost-model-inefficiency',
      category: 'cost_anomaly',
      priority: 'high',
      title: `${lowEff.length} model(s) showing low cost efficiency`,
      description: `${lowEff.map(m => m.model).join(', ')} have high cost-per-output ratios. These models cost $${wasteCost.toLocaleString()} in the current period.`,
      metric: `$${wasteCost.toLocaleString()}`,
      metricLabel: 'on low-eff models',
      savings: saving,
      action: 'Review model allocation rules',
      tags: ['models', 'cost'],
    });
  }

  // ── Top Prompt Opportunities ─────────────────────────────────────────────────

  // Prompts with low success but high usage
  const lowSuccessHighUse = promptRanking.filter(p => p.successRate < 82 && p.uses > 100);
  if (lowSuccessHighUse.length > 0) {
    const top = lowSuccessHighUse[0];
    insights.push({
      id: 'prompt-opp-low-success',
      category: 'prompt_opportunity',
      priority: 'high',
      title: `${lowSuccessHighUse.length} high-use prompts have <82% success rate`,
      description: `"${top.prompt.slice(0, 55)}…" has ${top.uses.toLocaleString()} uses at only ${top.successRate}% success. Improving these prompts reduces retries and saves tokens.`,
      metric: `${top.successRate}%`,
      metricLabel: 'success rate',
      savings: Math.round(totalCost * 0.04),
      action: 'Open Prompt Analytics',
      tags: ['prompts', 'quality'],
    });
  }

  // High-token prompts that could be condensed
  const heavyPrompts = promptRanking.filter(p => p.avgTokens > 2500 && p.uses > 50);
  if (heavyPrompts.length > 0) {
    const tokenSaving = heavyPrompts.reduce((s, p) => s + p.uses * (p.avgTokens - 1500) * 0.000002, 0);
    insights.push({
      id: 'prompt-opp-heavy',
      category: 'prompt_opportunity',
      priority: 'medium',
      title: `${heavyPrompts.length} prompts average >2,500 tokens`,
      description: `These prompts are token-heavy. Condensing to under 1,500 tokens where possible could save an estimated $${tokenSaving.toFixed(0)} per cycle.`,
      metric: `${heavyPrompts.length}`,
      metricLabel: 'heavy prompts',
      savings: Math.round(tokenSaving),
      action: 'Review in Prompt Analytics',
      tags: ['prompts', 'tokens'],
    });
  }

  // ── Model Switch Suggestions ─────────────────────────────────────────────────

  // Most expensive model vs cheaper alternative
  const sortedByCost = [...modelEff].sort((a, b) => b.cost - a.cost);
  const mostExpensive = sortedByCost[0];
  if (mostExpensive && totalCost > 0) {
    const share = ((mostExpensive.cost / totalCost) * 100).toFixed(1);
    const saving = Math.round(mostExpensive.cost * 0.25);
    insights.push({
      id: 'model-switch-expensive',
      category: 'model_switch',
      priority: 'high',
      title: `Switch some ${mostExpensive.model} usage to cheaper model`,
      description: `${mostExpensive.model} accounts for ${share}% of total costs. Routing non-complex tasks to a cheaper model like GPT-4o Mini or Claude Haiku could save ~25%.`,
      metric: `$${saving.toLocaleString()}`,
      metricLabel: 'estimated savings',
      savings: saving,
      action: 'Configure model router',
      tags: ['models', 'cost', 'optimization'],
    });
  }

  // High-efficiency models that are underused
  const highEffModels = modelEff.filter(m => m.tier === 'high' && m.costShare < 10);
  if (highEffModels.length > 0) {
    insights.push({
      id: 'model-switch-underused',
      category: 'model_switch',
      priority: 'medium',
      title: `${highEffModels[0].model} is highly efficient but underused`,
      description: `${highEffModels[0].model} has the best cost-efficiency score but only ${highEffModels[0].costShare}% cost share. Increasing its usage for routine tasks could reduce overall spend.`,
      metric: `${highEffModels[0].costShare}%`,
      metricLabel: 'current usage share',
      action: 'Increase routing to this model',
      tags: ['models', 'efficiency'],
    });
  }

  // ── Weekly Trends ────────────────────────────────────────────────────────────

  if (dailyUsage.length >= 14) {
    const lastWeek = dailyUsage.slice(-7);
    const prevWeek = dailyUsage.slice(-14, -7);
    const lastCost = lastWeek.reduce((s, d) => s + d.cost, 0);
    const prevCost = prevWeek.reduce((s, d) => s + d.cost, 0);
    const lastReq = lastWeek.reduce((s, d) => s + d.requests, 0);
    const prevReq = prevWeek.reduce((s, d) => s + d.requests, 0);
    const costChange = prevCost > 0 ? ((lastCost - prevCost) / prevCost) * 100 : 0;
    const reqChange = prevReq > 0 ? ((lastReq - prevReq) / prevReq) * 100 : 0;

    insights.push({
      id: 'trend-weekly-cost',
      category: 'weekly_trend',
      priority: costChange > 20 ? 'high' : 'medium',
      title: `Weekly cost ${costChange >= 0 ? 'up' : 'down'} ${Math.abs(costChange).toFixed(1)}%`,
      description: `Total spend this week: $${lastCost.toLocaleString()} vs $${prevCost.toLocaleString()} last week. ${costChange > 15 ? 'Growth is accelerating — review team budgets.' : 'Spend is relatively stable.'}`,
      metric: `${costChange >= 0 ? '+' : ''}${costChange.toFixed(1)}%`,
      metricLabel: 'week-over-week',
      delta: parseFloat(costChange.toFixed(1)),
      tags: ['trend', 'cost'],
    });

    insights.push({
      id: 'trend-weekly-requests',
      category: 'weekly_trend',
      priority: 'low',
      title: `AI requests ${reqChange >= 0 ? 'grew' : 'dropped'} ${Math.abs(reqChange).toFixed(1)}% WoW`,
      description: `${lastReq.toLocaleString()} requests this week vs ${prevReq.toLocaleString()} last week. ${reqChange > 20 ? 'Strong adoption growth across the org.' : 'Steady usage pattern.'}`,
      metric: `${reqChange >= 0 ? '+' : ''}${reqChange.toFixed(1)}%`,
      metricLabel: 'request growth',
      delta: parseFloat(reqChange.toFixed(1)),
      tags: ['trend', 'requests'],
    });
  }

  // Developer score trend
  const topScorers = devScores.slice(0, 3);
  const lowScorers = devScores.filter(d => d.score < 75);
  if (lowScorers.length > 0) {
    insights.push({
      id: 'trend-low-scores',
      category: 'weekly_trend',
      priority: 'medium',
      title: `${lowScorers.length} developers below 75% productivity score`,
      description: `${lowScorers.slice(0, 3).map(d => d.developer).join(', ')}${lowScorers.length > 3 ? ` and ${lowScorers.length - 3} more` : ''} are scoring below 75. Targeted coaching could improve team-wide output.`,
      metric: `${lowScorers.length}`,
      metricLabel: 'underperforming devs',
      action: 'View DeveloperXP',
      tags: ['productivity', 'developers'],
    });
  }

  // ── Hidden Insights ──────────────────────────────────────────────────────────

  // Detect platform with no cost growth (potential disengagement)
  const flatPlatform = platformUsage.find(p => p.costPct < 5);
  if (flatPlatform) {
    insights.push({
      id: 'hidden-flat-platform',
      category: 'hidden',
      priority: 'low',
      title: `${flatPlatform.name} usage is unusually flat`,
      description: `${flatPlatform.name} accounts for only ${flatPlatform.costPct}% of total spend. This may indicate low adoption or a misconfigured integration worth investigating.`,
      metric: `${flatPlatform.costPct}%`,
      metricLabel: 'cost share',
      action: 'Check platform integration',
      tags: ['platform', 'adoption'],
    });
  }

  // High-waste hidden pattern
  if (waste.totalEstimatedWasteCost > 5000) {
    const topWaste = waste.items[0];
    insights.push({
      id: 'hidden-waste-pattern',
      category: 'hidden',
      priority: 'high',
      title: `$${waste.totalEstimatedWasteCost.toLocaleString()} in recoverable AI waste`,
      description: `Top waste driver: "${topWaste.category}" (${topWaste.occurrences} occurrences, ${topWaste.severity} severity). Addressing this alone could recover ~$${Math.round(waste.totalEstimatedWasteCost * 0.7).toLocaleString()}.`,
      metric: `$${Math.round(waste.totalEstimatedWasteCost * 0.7).toLocaleString()}`,
      metricLabel: 'recoverable',
      savings: Math.round(waste.totalEstimatedWasteCost * 0.7),
      action: 'Open AI Waste Detector',
      tags: ['waste', 'hidden'],
    });
  }

  // Top developer contribution insight
  if (topScorers.length > 0) {
    const top = topScorers[0];
    insights.push({
      id: 'hidden-top-dev',
      category: 'hidden',
      priority: 'low',
      title: `${top.developer} is your top AI contributor`,
      description: `${top.developer} (${top.team}) leads with a ${top.score}% productivity score. Their prompt patterns and workflows could be shared org-wide as best practices.`,
      metric: `${top.score}%`,
      metricLabel: 'productivity score',
      action: 'View developer profile',
      tags: ['productivity', 'best-practice'],
    });
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ─── Full Analytics Report ─────────────────────────────────────────────────

export function computeFullReport() {
  const totals         = computeTotals();
  const dailyUsage     = computeDailyUsage();
  const platformUsage  = computePlatformUsage();
  const developerScores = computeDeveloperScores();
  const promptRanking  = computePromptRanking();
  const teamRanking    = computeTeamRanking();
  const modelEfficiency = computeModelEfficiency();
  const aiWaste        = computeAIWaste();
  const recommendations = computeRecommendations();

  return {
    totals,
    dailyUsage,
    platformUsage,
    developerScores,
    promptRanking,
    teamRanking,
    modelEfficiency,
    aiWaste,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
