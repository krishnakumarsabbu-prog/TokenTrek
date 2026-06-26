/**
 * Central analytics engine.
 * Synthesizes data from all telemetry sources (Devin, Git/CSV imports) into the shared
 * store tables that every dashboard page reads from:
 *   - store.platforms
 *   - store.teams
 *   - store.developers
 *   - store.developer_scores
 *   - store.team_costs
 *   - store.daily_stats
 *   - store.live_activity
 *   - store.model_costs
 *   - store.insights
 */

import {
  store,
  Platform, Team, Developer, DailyStat, DeveloperScore,
  TeamCost, ModelCost, LiveActivity, Insight,
} from './db';

// ── Stable deterministic helpers ─────────────────────────────────────────────

function seededRand(seed: number, min: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000;
  const frac = x - Math.floor(x);
  return Math.floor(frac * (max - min + 1)) + min;
}

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

// Devin platform id (stable)
const DEVIN_PLATFORM_ID = 9999;
const DEVIN_PLATFORM: Platform = {
  id: DEVIN_PLATFORM_ID,
  name: 'Devin',
  color: '#0078d4',
  icon: 'bot',
};

/**
 * Recalculate all shared store tables from current devin_sessions.
 * Preserves any previously imported non-Devin store entries.
 */
export function recalculateFromDevin(): void {
  const sessions = store.devin_sessions;
  if (sessions.length === 0) return;

  console.log(`\n[AnalyticsEngine] Recalculating from ${sessions.length} Devin sessions...`);

  // ── 1. Ensure Devin platform exists ─────────────────────────────────────────
  if (!store.platforms.find(p => p.id === DEVIN_PLATFORM_ID)) {
    store.platforms.push(DEVIN_PLATFORM);
  }

  // ── 2. Build developer map (group by user_email) ──────────────────────────
  interface DevAccum {
    email: string;
    name: string;
    teamName: string;
    sessions: number;
    acuUsed: number;
    totalPRs: number;
    mergedPRs: number;
    openPRs: number;
    categories: Set<string>;
    dates: string[];
    lastActivity: string;
  }

  const devMap = new Map<string, DevAccum>();

  for (const s of sessions) {
    const key = s.user_email.toLowerCase();
    let acc = devMap.get(key);
    if (!acc) {
      acc = {
        email: s.user_email,
        name: s.user_name || s.user_email,
        teamName: s.team_id || s.org_name || 'Unknown',
        sessions: 0, acuUsed: 0, totalPRs: 0, mergedPRs: 0, openPRs: 0,
        categories: new Set(), dates: [], lastActivity: s.created_at,
      };
      devMap.set(key, acc);
    }
    acc.sessions += 1;
    acc.acuUsed += s.acu_used;
    for (const pr of s.pull_requests) {
      acc.totalPRs += 1;
      if (pr.pr_status === 'merged') acc.mergedPRs += 1;
      else if (pr.pr_status === 'open') acc.openPRs += 1;
    }
    if (s.category) acc.categories.add(s.category);
    acc.dates.push(s.created_at.slice(0, 10));
    if (s.created_at > acc.lastActivity) acc.lastActivity = s.created_at;
  }

  // ── 3. Build team map ──────────────────────────────────────────────────────
  interface TeamAccum {
    name: string;
    devEmails: Set<string>;
    sessions: number;
    acuUsed: number;
    totalPRs: number;
    mergedPRs: number;
  }

  const teamMap = new Map<string, TeamAccum>();
  for (const acc of devMap.values()) {
    let ta = teamMap.get(acc.teamName);
    if (!ta) {
      ta = { name: acc.teamName, devEmails: new Set(), sessions: 0, acuUsed: 0, totalPRs: 0, mergedPRs: 0 };
      teamMap.set(acc.teamName, ta);
    }
    ta.devEmails.add(acc.email);
    ta.sessions += acc.sessions;
    ta.acuUsed += acc.acuUsed;
    ta.totalPRs += acc.totalPRs;
    ta.mergedPRs += acc.mergedPRs;
  }

  // ── 4. Upsert Teams into store ─────────────────────────────────────────────
  let nextTeamId = Math.max(0, ...store.teams.map(t => t.id)) + 1;
  // Index existing teams by name for reuse
  const existingTeamsByName = new Map(store.teams.map(t => [t.name.toLowerCase(), t]));
  const teamIdByName = new Map<string, number>();

  for (const [, ta] of teamMap) {
    const existing = existingTeamsByName.get(ta.name.toLowerCase());
    if (existing) {
      teamIdByName.set(ta.name, existing.id);
    } else {
      const newTeam: Team = { id: nextTeamId++, name: ta.name };
      store.teams.push(newTeam);
      teamIdByName.set(ta.name, newTeam.id);
    }
  }

  // ── 5. Upsert Developers into store ──────────────────────────────────────
  let nextDevId = Math.max(0, ...store.developers.map(d => d.id)) + 1;
  const existingDevsByEmail = new Map(
    store.developers
      .filter(d => (d as any).email)
      .map(d => [(d as any).email.toLowerCase(), d])
  );
  const devIdByEmail = new Map<string, number>();

  for (const [, acc] of devMap) {
    const teamId = teamIdByName.get(acc.teamName) ?? 1;
    const seed = hashStr(acc.email);
    const initials = acc.name.split(/[\s.@]/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
    const avatar = initials || acc.email.slice(0, 2).toUpperCase();

    const existing = existingDevsByEmail.get(acc.email.toLowerCase());
    if (existing) {
      devIdByEmail.set(acc.email.toLowerCase(), existing.id);
    } else {
      const newDev: Developer & { email: string } = {
        id: nextDevId++,
        name: acc.name,
        avatar,
        team_id: teamId,
        email: acc.email,
      };
      store.developers.push(newDev as Developer);
      devIdByEmail.set(acc.email.toLowerCase(), newDev.id);
    }
  }

  // ── 6. Upsert DeveloperScores ─────────────────────────────────────────────
  // Remove old Devin-sourced scores, replace with fresh
  store.developer_scores = store.developer_scores.filter(ds => !(ds as any).source_devin);

  let scoreIdx = 0;
  const devAccList = Array.from(devMap.values()).sort((a, b) => {
    const aScore = a.mergedPRs * 40 + a.sessions * 30;
    const bScore = b.mergedPRs * 40 + b.sessions * 30;
    return bScore - aScore;
  });

  for (const acc of devAccList) {
    const devId = devIdByEmail.get(acc.email.toLowerCase());
    if (!devId) continue;

    const seed = hashStr(acc.email);
    const successRate = acc.totalPRs > 0 ? Math.round((acc.mergedPRs / acc.totalPRs) * 100) : 60;
    const acuEfficiency = acc.acuUsed > 0 ? Math.min(99, Math.round((acc.mergedPRs / acc.acuUsed) * 30)) : 60;
    const diversityBonus = Math.min(acc.categories.size * 5, 20);
    const sessionBonus = Math.min(acc.sessions * 3, 30);

    // Base score: success rate weighted with efficiency and diversity
    const rawScore = Math.round(
      successRate * 0.4 +
      acuEfficiency * 0.3 +
      sessionBonus * 0.2 +
      diversityBonus * 0.1 +
      seededRand(seed + 7, -3, 3)
    );
    const score = Math.max(50, Math.min(99, rawScore));
    const trend = seededRand(seed + 3, -8, 12);

    const entry: DeveloperScore & { source_devin?: boolean } = {
      id: 10000 + scoreIdx++,
      developer_id: devId,
      score,
      trend,
      period: 'current',
      source_devin: true,
    };
    store.developer_scores.push(entry);
  }

  // ── 7. Upsert TeamCosts ────────────────────────────────────────────────────
  store.team_costs = store.team_costs.filter(tc => !(tc as any).source_devin);

  let tcIdx = 0;
  for (const [, ta] of teamMap) {
    const teamId = teamIdByName.get(ta.name);
    if (!teamId) continue;
    // Approximate cost: 1 ACU ≈ $0.20
    const cost = Math.round(ta.acuUsed * 0.2 * 100);
    const seed = hashStr(ta.name);
    const changePct = seededRand(seed, -15, 35);

    const tc: TeamCost & { source_devin?: boolean } = {
      id: 10000 + tcIdx++,
      team_id: teamId,
      cost,
      change_pct: changePct,
      period: 'current',
      source_devin: true,
    };
    store.team_costs.push(tc);
  }

  // ── 8. Synthesize DailyStats from Devin sessions ──────────────────────────
  // Remove existing Devin-sourced daily stats
  store.daily_stats = store.daily_stats.filter(ds => !(ds as any).source_devin);

  const dateAcu = new Map<string, number>();
  const dateCount = new Map<string, number>();
  for (const s of sessions) {
    const d = s.created_at.slice(0, 10);
    dateAcu.set(d, (dateAcu.get(d) ?? 0) + s.acu_used);
    dateCount.set(d, (dateCount.get(d) ?? 0) + 1);
  }

  let dsIdx = 0;
  const maxExistingDsId = store.daily_stats.length > 0 ? Math.max(...store.daily_stats.map(d => d.id)) : 0;
  for (const [date, acu] of dateAcu) {
    const requests = dateCount.get(date) ?? 1;
    // Convert ACU to rough token equivalent (1 ACU ≈ 50K tokens)
    const tokens = Math.round(acu * 50000);
    // Cost: 1 ACU ≈ $0.20
    const cost = acu * 0.2;

    const ds: DailyStat & { source_devin?: boolean } = {
      id: maxExistingDsId + 10000 + dsIdx++,
      date,
      platform_id: DEVIN_PLATFORM_ID,
      requests,
      tokens,
      cost,
      source_devin: true,
    };
    store.daily_stats.push(ds);
  }

  // ── 9. Synthesize LiveActivity from recent Devin sessions ────────────────
  store.live_activity = store.live_activity.filter(la => !(la as any).source_devin);

  const recentSessions = [...sessions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);

  let laIdx = 0;
  const maxLaId = store.live_activity.length > 0 ? Math.max(...store.live_activity.map(la => la.id)) : 0;
  for (const s of recentSessions) {
    const devId = devIdByEmail.get(s.user_email.toLowerCase());
    if (!devId) continue;

    const hasMerged = s.pull_requests.some(pr => pr.pr_status === 'merged');
    const action = hasMerged
      ? `Merged PR via Devin: ${s.session_name.slice(0, 60)}`
      : `Devin session: ${s.session_name.slice(0, 60)}`;

    const la: LiveActivity & { source_devin?: boolean } = {
      id: maxLaId + 10000 + laIdx++,
      developer_id: devId,
      action,
      platform_id: DEVIN_PLATFORM_ID,
      created_at: s.created_at,
      source_devin: true,
    };
    store.live_activity.push(la);
  }

  // ── 10. Synthesize ModelCosts ──────────────────────────────────────────────
  store.model_costs = store.model_costs.filter(mc => !(mc as any).source_devin);
  const totalAcu = sessions.reduce((s, x) => s + x.acu_used, 0);
  const devinCost = totalAcu * 0.2;
  if (devinCost > 0) {
    const totalExisting = store.model_costs.reduce((s, m) => s + m.cost, 0);
    const grand = totalExisting + devinCost;
    const pct = grand > 0 ? Math.round((devinCost / grand) * 1000) / 10 : 100;
    const mc: ModelCost & { source_devin?: boolean } = {
      id: 99999,
      model_name: 'Devin AI',
      cost: Math.round(devinCost),
      pct,
      period: 'current',
      source_devin: true,
    };
    store.model_costs.push(mc);
  }

  // ── 11. Add Devin-specific insights ──────────────────────────────────────
  store.insights = store.insights.filter(i => !(i as any).source_devin);
  const totalMerged = sessions.reduce((s, x) => s + x.pull_requests.filter(p => p.pr_status === 'merged').length, 0);
  const totalPRs = sessions.reduce((s, x) => s + x.pull_requests.length, 0);
  const deliveryRate = totalPRs > 0 ? Math.round((totalMerged / totalPRs) * 100) : 0;
  const uniqueDevs = new Set(sessions.map(s => s.user_email)).size;

  store.insights.push({
    id: 99001,
    type: 'recommendation',
    title: `Devin AI: ${deliveryRate}% PR delivery rate across ${uniqueDevs} developers`,
    description: `${sessions.length} Devin sessions recorded. ${totalMerged} of ${totalPRs} PRs merged. ${uniqueDevs} developers actively using AI-assisted development.`,
    icon: 'bot',
  } as Insight & { source_devin?: boolean });

  // ── Log summary ────────────────────────────────────────────────────────────
  console.log(`[AnalyticsEngine] Devin Upload Complete`);
  console.log(`  Sessions:           ${sessions.length}`);
  console.log(`  Developers Updated: ${devMap.size}`);
  console.log(`  Teams Updated:      ${teamMap.size}`);
  console.log(`  Daily Stats Added:  ${dateAcu.size} days`);
  console.log(`  AI League Updated:  ${devMap.size} developers`);
  console.log(`  Team Battle Updated:${teamMap.size} teams`);
  console.log(`  Dashboard Metrics Refreshed`);
}
