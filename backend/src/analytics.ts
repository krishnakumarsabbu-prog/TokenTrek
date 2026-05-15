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
