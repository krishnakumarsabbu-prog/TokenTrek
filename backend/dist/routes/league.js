"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
function seededRandom(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}
function makeDevScores() {
    const developers = db_1.store.developers || [];
    const teams = db_1.store.teams || [];
    const platforms = db_1.store.platforms || [];
    if (developers.length === 0) {
        return [];
    }
    return developers.map((dev, i) => {
        const base = Math.max(50, 95 - i * 2.5);
        const tokenEff = Math.round(base - seededRandom(dev.id * 7) * 8 + 3);
        const promptSuccess = Math.round(base - seededRandom(dev.id * 13) * 10 + 2);
        const codeAcceptance = Math.round(base - seededRandom(dev.id * 17) * 12 + 4);
        const modelOpt = Math.round(base - seededRandom(dev.id * 23) * 6 + 1);
        const productivityGain = Math.round(base - seededRandom(dev.id * 31) * 9 + 3);
        const totalScore = Math.round((tokenEff + promptSuccess + codeAcceptance + modelOpt + productivityGain) / 5);
        const costSaved = Math.round(1200 - i * 95 + seededRandom(dev.id * 11) * 200);
        const promptsCreated = Math.round(42 - i * 3 + seededRandom(dev.id * 19) * 8);
        const adoptionScore = Math.round(base + seededRandom(dev.id * 37) * 5 - 2);
        const team = teams.find(t => t.id === dev.team_id);
        const platform = platforms[i % platforms.length]?.name || 'Claude';
        return {
            rank: i + 1,
            name: dev.name,
            avatar: dev.avatar,
            team: team ? team.name : 'Unknown Team',
            platform,
            totalScore: Math.min(99, totalScore),
            tokenEfficiency: Math.min(99, tokenEff),
            promptSuccessRate: Math.min(99, promptSuccess),
            codeAcceptance: Math.min(99, codeAcceptance),
            modelOptimization: Math.min(99, modelOpt),
            productivityGain: Math.min(99, productivityGain),
            costSaved,
            promptsCreated,
            adoptionScore: Math.min(99, adoptionScore),
            weeklyChange: Math.round(seededRandom(dev.id * 43) * 12 - 4),
        };
    }).sort((a, b) => b.totalScore - a.totalScore).map((d, i) => ({ ...d, rank: i + 1 }));
}
function makeTeamScores() {
    const teams = db_1.store.teams || [];
    if (teams.length === 0) {
        return [];
    }
    return teams.map((team, i) => {
        const base = Math.max(50, 90 - i * 3);
        const tokenEff = Math.round(base - seededRandom(team.id * 7 + 100) * 8 + 3);
        const promptSuccess = Math.round(base - seededRandom(team.id * 13 + 100) * 10 + 2);
        const codeAcceptance = Math.round(base - seededRandom(team.id * 17 + 100) * 12 + 4);
        const modelOpt = Math.round(base - seededRandom(team.id * 23 + 100) * 6 + 1);
        const productivityGain = Math.round(base - seededRandom(team.id * 31 + 100) * 9 + 3);
        const totalScore = Math.round((tokenEff + promptSuccess + codeAcceptance + modelOpt + productivityGain) / 5);
        const costSaved = Math.round(5200 - i * 400 + seededRandom(team.id * 11 + 100) * 600);
        const adoptionScore = Math.round(base + seededRandom(team.id * 37 + 100) * 5 - 2);
        return {
            rank: i + 1,
            name: team.name,
            size: db_1.store.developers.filter(d => d.team_id === team.id).length || 3,
            totalScore: Math.min(99, totalScore),
            tokenEfficiency: Math.min(99, tokenEff),
            promptSuccessRate: Math.min(99, promptSuccess),
            codeAcceptance: Math.min(99, codeAcceptance),
            modelOptimization: Math.min(99, modelOpt),
            productivityGain: Math.min(99, productivityGain),
            costSaved,
            adoptionScore: Math.min(99, adoptionScore),
            weeklyChange: Math.round(seededRandom(team.id * 43 + 100) * 10 - 3),
        };
    }).sort((a, b) => b.totalScore - a.totalScore).map((t, i) => ({ ...t, rank: i + 1 }));
}
router.get('/developer-leaderboard', (_req, res) => {
    res.json(makeDevScores());
});
// GET /api/league/developer/:name — detail for a single developer
router.get('/developer/:name', (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const allDevs = makeDevScores();
    const dev = allDevs.find(d => d.name === name);
    if (!dev)
        return res.status(404).json({ error: 'Developer not found' });
    // Pull Devin data if available
    const devinStat = db_1.store.devin_developer_stats.find(d => d.user_name === name || d.user_email.includes(name.toLowerCase().replace(' ', '.')));
    // Build activity timeline from daily_stats (last 14 days of activity)
    const dbDev = db_1.store.developers.find(d => d.name === name);
    const devScoreEntry = dbDev ? db_1.store.developer_scores.find(ds => ds.developer_id === dbDev.id) : null;
    const teamEntry = dbDev ? db_1.store.teams.find(t => t.id === dbDev.team_id) : null;
    // Gather sessions for this developer from devin_sessions
    const devSessions = devinStat
        ? db_1.store.devin_sessions.filter(s => s.user_name === name || (devinStat && s.user_email === devinStat.user_email))
        : [];
    // Build timeline from devin sessions
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
    // Category breakdown
    const catMap = new Map();
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
    res.json(makeTeamScores());
});
// GET /api/league/team/:name — detail for a single team
router.get('/team/:name', (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const allTeams = makeTeamScores();
    const team = allTeams.find(t => t.name === name);
    if (!team)
        return res.status(404).json({ error: 'Team not found' });
    const dbTeam = db_1.store.teams.find(t => t.name === name);
    const members = dbTeam
        ? db_1.store.developers.filter(d => d.team_id === dbTeam.id)
        : [];
    // Build member profiles with scores
    const allDevs = makeDevScores();
    const memberProfiles = members.map(m => {
        const devScore = allDevs.find(d => d.name === m.name);
        const devinStat = db_1.store.devin_developer_stats.find(d => d.user_name === m.name);
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
    // Devin team stat
    const devinTeam = db_1.store.devin_team_stats.find(dt => dt.team_name.toLowerCase() === name.toLowerCase() ||
        name.toLowerCase().includes(dt.team_name.toLowerCase().split(' ')[0].toLowerCase()));
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
    const devs = makeDevScores();
    const teams = makeTeamScores();
    if (devs.length === 0 || teams.length === 0) {
        return res.json({
            weekly: {
                developer: null,
                team: null,
            },
            monthly: {
                developer: null,
                team: null,
            },
            special: {
                bestPromptCreator: null,
                highestCostSaver: null,
                topAIAdopter: null,
            },
        });
    }
    const weeklyDevChamp = devs[0];
    const monthlyDevChamp = devs[1] ? { ...devs[1], totalScore: devs[1].totalScore + 2 } : devs[0];
    const weeklyTeamChamp = teams[0];
    const monthlyTeamChamp = teams[1] ? { ...teams[1], totalScore: teams[1].totalScore + 1 } : teams[0];
    const bestPromptCreator = [...devs].sort((a, b) => b.promptsCreated - a.promptsCreated)[0];
    const highestCostSaver = [...devs].sort((a, b) => b.costSaved - a.costSaved)[0];
    const topAIAdopter = [...devs].sort((a, b) => b.adoptionScore - a.adoptionScore)[0];
    res.json({
        weekly: {
            developer: weeklyDevChamp,
            team: weeklyTeamChamp,
        },
        monthly: {
            developer: monthlyDevChamp,
            team: monthlyTeamChamp,
        },
        special: {
            bestPromptCreator,
            highestCostSaver,
            topAIAdopter,
        },
    });
});
exports.default = router;
