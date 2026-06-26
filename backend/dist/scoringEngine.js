"use strict";
/**
 * Unified AI developer scoring engine.
 *
 * Single source of truth for all ranking systems:
 *   - Developer Intelligence (Developers page)
 *   - Developer XP
 *   - AI League leaderboard
 *   - Team Battle scoring
 *
 * Formula (100-point composite):
 *   Devin Contribution   40%  — merged PRs, sessions, adoption
 *   Git Contribution     30%  — proxied by promptsCreated, tasksCompleted
 *   AI Usage Efficiency  20%  — ACU efficiency, consistency
 *   Quality Impact       10%  — PR success rate, task completion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XP_LEVELS = void 0;
exports.getXpLevel = getXpLevel;
exports.computeUnifiedDeveloperScores = computeUnifiedDeveloperScores;
exports.computeUnifiedTeamScores = computeUnifiedTeamScores;
const db_1 = require("./db");
// ── Deterministic helpers ─────────────────────────────────────────────────────
function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}
function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++)
        h = ((h << 5) + h) ^ s.charCodeAt(i);
    return Math.abs(h);
}
function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}
// ── XP level table ────────────────────────────────────────────────────────────
exports.XP_LEVELS = [
    { name: 'Beginner', minXp: 0, maxXp: 999, color: '#8ba3be', badge: '🌱' },
    { name: 'Explorer', minXp: 1000, maxXp: 2999, color: '#10b981', badge: '🔍' },
    { name: 'Prompt Ninja', minXp: 3000, maxXp: 5999, color: '#0078d4', badge: '⚡' },
    { name: 'Token Master', minXp: 6000, maxXp: 9999, color: '#d97706', badge: '🔥' },
    { name: 'AI Champion', minXp: 10000, maxXp: Infinity, color: '#e07b39', badge: '🏆' },
];
function getXpLevel(xp) {
    for (let i = exports.XP_LEVELS.length - 1; i >= 0; i--) {
        if (xp >= exports.XP_LEVELS[i].minXp)
            return { ...exports.XP_LEVELS[i], index: i };
    }
    return { ...exports.XP_LEVELS[0], index: 0 };
}
/**
 * Compute unified developer scores for all developers in the store.
 * Merges Devin telemetry with synthetic/seeded baseline metrics so
 * every page uses an identical ranking.
 */
function computeUnifiedDeveloperScores() {
    const developers = db_1.store.developers;
    const teams = db_1.store.teams;
    const platforms = db_1.store.platforms;
    const results = developers.map((dev, i) => {
        const seed = dev.id * 137 + 42;
        const nameSeed = hashStr(dev.name);
        const team = teams.find(t => t.id === dev.team_id);
        const platform = platforms[i % Math.max(platforms.length, 1)]?.name || 'Claude';
        // ── Devin contribution ────────────────────────────────────────────────────
        const devinStat = db_1.store.devin_developer_stats.find(d => d.user_email.toLowerCase() === (dev.email || '').toLowerCase() ||
            d.user_name === dev.name);
        const devinSessions = devinStat?.sessions ?? 0;
        const mergedPRs = devinStat?.merged_prs ?? 0;
        const totalPRs = devinStat?.total_prs ?? 0;
        const acuUsed = devinStat?.acu_used ?? 0;
        const categories = devinStat?.categories ?? [];
        // Devin contribution (0–100): merged PRs × 50, sessions × 30, diversity × 20
        const maxMerged = Math.max(...db_1.store.devin_developer_stats.map(d => d.merged_prs), 1);
        const maxSessions = Math.max(...db_1.store.devin_developer_stats.map(d => d.sessions), 1);
        const mergedNorm = devinSessions > 0 ? clamp((mergedPRs / maxMerged) * 100, 0, 100) : 0;
        const sessionNorm = devinSessions > 0 ? clamp((devinSessions / maxSessions) * 100, 0, 100) : 0;
        const diversityNorm = Math.min(categories.length * 20, 100);
        const rawDevinScore = (mergedNorm * 0.5 + sessionNorm * 0.3 + diversityNorm * 0.2);
        // ── Seeded baseline metrics (stable across restarts) ─────────────────────
        const baseScore = Math.max(50, 95 - i * 2.5);
        const promptsUsed = Math.round(80 + seededRand(seed) * 1120);
        const successfulPrompts = Math.round(promptsUsed * (0.70 + seededRand(seed + 1) * 0.28));
        const acceptedCodeBlocks = Math.round(30 + seededRand(seed + 2) * 570);
        const timeSavedHrs = Math.round(20 + seededRand(seed + 3) * 330);
        const aiEfficiency = Math.round(55 + seededRand(seed + 4) * 44);
        // ── Git contribution — proxied from seeded baseline ───────────────────────
        const gitContrib = clamp(Math.round(baseScore - seededRand(nameSeed * 7) * 8 + 3), 50, 99);
        // ── AI usage efficiency ───────────────────────────────────────────────────
        const acuEfficiency = acuUsed > 0 && mergedPRs > 0
            ? clamp(Math.round((mergedPRs / acuUsed) * 30), 0, 99)
            : clamp(aiEfficiency, 50, 99);
        // ── Quality impact ────────────────────────────────────────────────────────
        const prSuccessRate = totalPRs > 0 ? Math.round((mergedPRs / totalPRs) * 100) : 70;
        const qualityImpact = clamp(devinSessions > 0
            ? Math.round(prSuccessRate * 0.7 + (successfulPrompts / Math.max(promptsUsed, 1)) * 100 * 0.3)
            : clamp(Math.round(baseScore * 0.9 + seededRand(nameSeed + 5) * 10), 50, 99), 50, 99);
        // ── Composite score (0–99) ────────────────────────────────────────────────
        const devinComponent = devinSessions > 0 ? rawDevinScore : clamp(baseScore - 5 + seededRand(nameSeed + 9) * 10, 50, 99);
        const totalScore = clamp(Math.round(devinComponent * 0.40 +
            gitContrib * 0.30 +
            acuEfficiency * 0.20 +
            qualityImpact * 0.10), 50, 99);
        // ── XP calculation ─────────────────────────────────────────────────────────
        // XP = score * 10 (base) + merged PR XP + devin activity XP + prompts + code
        const xp = Math.round(totalScore * 10 +
            mergedPRs * 80 +
            devinSessions * 30 +
            successfulPrompts * 3 +
            acceptedCodeBlocks * 8 +
            Math.round(aiEfficiency * 12) +
            timeSavedHrs * 5);
        const level = getXpLevel(xp);
        const nextLevel = exports.XP_LEVELS[Math.min(level.index + 1, exports.XP_LEVELS.length - 1)];
        const xpProgress = level.index === exports.XP_LEVELS.length - 1
            ? 100
            : clamp(Math.round(((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100), 0, 100);
        // ── League display fields ──────────────────────────────────────────────────
        const tokenEff = clamp(Math.round(totalScore - seededRand(dev.id * 7) * 8 + 3), 50, 99);
        const promptSuccess = clamp(Math.round(totalScore - seededRand(dev.id * 13) * 10 + 2), 50, 99);
        const codeAccept = clamp(Math.round(totalScore - seededRand(dev.id * 17) * 12 + 4), 50, 99);
        const modelOpt = clamp(Math.round(totalScore - seededRand(dev.id * 23) * 6 + 1), 50, 99);
        const prodGain = clamp(Math.round(totalScore - seededRand(dev.id * 31) * 9 + 3), 50, 99);
        const costSaved = Math.round(1200 - i * 95 + seededRand(dev.id * 11) * 200);
        const promptsCreated = Math.round(42 - i * 3 + seededRand(dev.id * 19) * 8);
        const adoption = clamp(Math.round(totalScore + seededRand(dev.id * 37) * 5 - 2), 50, 99);
        const weeklyChange = Math.round(seededRand(dev.id * 43) * 12 - 4);
        return {
            developer_id: dev.id,
            name: dev.name,
            avatar: dev.avatar,
            team: team?.name ?? 'Unknown Team',
            platform,
            totalScore,
            devinScore: Math.round(devinComponent),
            gitScore: gitContrib,
            efficiencyScore: acuEfficiency,
            qualityScore: qualityImpact,
            devinSessions,
            mergedPRs,
            totalPRs,
            acuUsed,
            categories,
            // League compat aliases
            totalScore2: totalScore,
            tokenEfficiency: tokenEff,
            promptSuccessRate: promptSuccess,
            codeAcceptance: codeAccept,
            modelOptimization: modelOpt,
            productivityGain: prodGain,
            costSaved,
            promptsCreated,
            adoptionScore: adoption,
            weeklyChange,
            // XP
            xp,
            xpProgress,
            level: level.name,
            levelColor: level.color,
            levelIndex: level.index,
            aiEfficiency,
            promptsUsed,
            successfulPrompts,
            acceptedCode: acceptedCodeBlocks,
            timeSavedHrs,
            estimatedROI: timeSavedHrs * 120,
            rank: 0,
        };
    });
    // Sort by totalScore descending, assign rank
    results.sort((a, b) => b.totalScore - a.totalScore || b.xp - a.xp);
    results.forEach((d, i) => { d.rank = i + 1; });
    return results;
}
function computeUnifiedTeamScores() {
    const teams = db_1.store.teams;
    const devScores = computeUnifiedDeveloperScores();
    const results = teams.map((team, i) => {
        const seed = team.id * 137 + 101;
        const teamDevs = devScores.filter(d => d.team === team.name);
        const avgScore = teamDevs.length
            ? Math.round(teamDevs.reduce((s, d) => s + d.totalScore, 0) / teamDevs.length)
            : clamp(Math.round(90 - i * 3 - seededRand(team.id * 7) * 8 + 3), 50, 99);
        const devinTeam = db_1.store.devin_team_stats.find(dt => dt.team_name.toLowerCase() === team.name.toLowerCase());
        const devinAdoptionBonus = devinTeam
            ? clamp(Math.round((devinTeam.sessions / Math.max(devinTeam.developers, 1)) * 2), 0, 15)
            : 0;
        const devinDeliveryBonus = devinTeam && devinTeam.total_prs > 0
            ? clamp(Math.round((devinTeam.merged_prs / devinTeam.total_prs) * 10), 0, 10)
            : 0;
        const totalScore = clamp(avgScore + devinAdoptionBonus + devinDeliveryBonus, 50, 99);
        return {
            rank: i + 1,
            name: team.name,
            size: db_1.store.developers.filter(d => d.team_id === team.id).length || 3,
            totalScore,
            tokenEfficiency: clamp(Math.round(totalScore - seededRand(team.id * 7 + 100) * 8 + 3), 50, 99),
            promptSuccessRate: clamp(Math.round(totalScore - seededRand(team.id * 13 + 100) * 10 + 2), 50, 99),
            codeAcceptance: clamp(Math.round(totalScore - seededRand(team.id * 17 + 100) * 12 + 4), 50, 99),
            modelOptimization: clamp(Math.round(totalScore - seededRand(team.id * 23 + 100) * 6 + 1), 50, 99),
            productivityGain: clamp(Math.round(totalScore - seededRand(team.id * 31 + 100) * 9 + 3), 50, 99),
            costSaved: Math.round(5200 - i * 400 + seededRand(team.id * 11 + 100) * 600),
            adoptionScore: clamp(Math.round(totalScore + seededRand(team.id * 37 + 100) * 5 - 2), 50, 99),
            weeklyChange: Math.round(seededRand(team.id * 43 + 100) * 10 - 3),
            devinSessions: devinTeam?.sessions ?? 0,
            devinMergedPRs: devinTeam?.merged_prs ?? 0,
            devinAiScore: devinTeam?.ai_score ?? 0,
        };
    });
    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((t, i) => { t.rank = i + 1; });
    return results;
}
