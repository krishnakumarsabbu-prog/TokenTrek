"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const DEVELOPERS = [
    { name: 'Rohit Sharma', avatar: 'RS', team: 'Platform Team', platform: 'Claude' },
    { name: 'Anita Patel', avatar: 'AP', team: 'Backend Team', platform: 'GPT-4o' },
    { name: 'Sandeep Yadav', avatar: 'SY', team: 'Frontend Team', platform: 'Cursor' },
    { name: 'Priya Verma', avatar: 'PV', team: 'DevOps Team', platform: 'GitHub Copilot' },
    { name: 'Karan Singh', avatar: 'KS', team: 'QA Automation', platform: 'Claude' },
    { name: 'Maya Johnson', avatar: 'MJ', team: 'Platform Team', platform: 'GPT-4o' },
    { name: 'Raj Kumar', avatar: 'RK', team: 'Backend Team', platform: 'Cursor' },
    { name: 'Sofia Chen', avatar: 'SC', team: 'Frontend Team', platform: 'Claude' },
    { name: 'David Park', avatar: 'DP', team: 'DevOps Team', platform: 'GitHub Copilot' },
    { name: 'Aisha Williams', avatar: 'AW', team: 'QA Automation', platform: 'GPT-4o' },
];
const TEAMS = [
    { name: 'Platform Team', size: 4 },
    { name: 'Backend Team', size: 5 },
    { name: 'Frontend Team', size: 4 },
    { name: 'DevOps Team', size: 3 },
    { name: 'QA Automation', size: 3 },
];
function seededRandom(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}
function makeDevScores() {
    return DEVELOPERS.map((dev, i) => {
        const base = 95 - i * 2.5;
        const tokenEff = Math.round(base - seededRandom(i * 7) * 8 + 3);
        const promptSuccess = Math.round(base - seededRandom(i * 13) * 10 + 2);
        const codeAcceptance = Math.round(base - seededRandom(i * 17) * 12 + 4);
        const modelOpt = Math.round(base - seededRandom(i * 23) * 6 + 1);
        const productivityGain = Math.round(base - seededRandom(i * 31) * 9 + 3);
        const totalScore = Math.round((tokenEff + promptSuccess + codeAcceptance + modelOpt + productivityGain) / 5);
        const costSaved = Math.round(1200 - i * 95 + seededRandom(i * 11) * 200);
        const promptsCreated = Math.round(42 - i * 3 + seededRandom(i * 19) * 8);
        const adoptionScore = Math.round(base + seededRandom(i * 37) * 5 - 2);
        return {
            rank: i + 1,
            name: dev.name,
            avatar: dev.avatar,
            team: dev.team,
            platform: dev.platform,
            totalScore: Math.min(99, totalScore),
            tokenEfficiency: Math.min(99, tokenEff),
            promptSuccessRate: Math.min(99, promptSuccess),
            codeAcceptance: Math.min(99, codeAcceptance),
            modelOptimization: Math.min(99, modelOpt),
            productivityGain: Math.min(99, productivityGain),
            costSaved,
            promptsCreated,
            adoptionScore: Math.min(99, adoptionScore),
            weeklyChange: Math.round(seededRandom(i * 43) * 12 - 4),
        };
    }).sort((a, b) => b.totalScore - a.totalScore).map((d, i) => ({ ...d, rank: i + 1 }));
}
function makeTeamScores() {
    return TEAMS.map((team, i) => {
        const base = 90 - i * 3;
        const tokenEff = Math.round(base - seededRandom(i * 7 + 100) * 8 + 3);
        const promptSuccess = Math.round(base - seededRandom(i * 13 + 100) * 10 + 2);
        const codeAcceptance = Math.round(base - seededRandom(i * 17 + 100) * 12 + 4);
        const modelOpt = Math.round(base - seededRandom(i * 23 + 100) * 6 + 1);
        const productivityGain = Math.round(base - seededRandom(i * 31 + 100) * 9 + 3);
        const totalScore = Math.round((tokenEff + promptSuccess + codeAcceptance + modelOpt + productivityGain) / 5);
        const costSaved = Math.round(5200 - i * 400 + seededRandom(i * 11 + 100) * 600);
        const adoptionScore = Math.round(base + seededRandom(i * 37 + 100) * 5 - 2);
        return {
            rank: i + 1,
            name: team.name,
            size: team.size,
            totalScore: Math.min(99, totalScore),
            tokenEfficiency: Math.min(99, tokenEff),
            promptSuccessRate: Math.min(99, promptSuccess),
            codeAcceptance: Math.min(99, codeAcceptance),
            modelOptimization: Math.min(99, modelOpt),
            productivityGain: Math.min(99, productivityGain),
            costSaved,
            adoptionScore: Math.min(99, adoptionScore),
            weeklyChange: Math.round(seededRandom(i * 43 + 100) * 10 - 3),
        };
    }).sort((a, b) => b.totalScore - a.totalScore).map((t, i) => ({ ...t, rank: i + 1 }));
}
router.get('/developer-leaderboard', (_req, res) => {
    res.json(makeDevScores());
});
router.get('/team-leaderboard', (_req, res) => {
    res.json(makeTeamScores());
});
router.get('/champions', (_req, res) => {
    const devs = makeDevScores();
    const teams = makeTeamScores();
    const weeklyDevChamp = devs[0];
    const monthlyDevChamp = { ...devs[1], totalScore: devs[1].totalScore + 2 };
    const weeklyTeamChamp = teams[0];
    const monthlyTeamChamp = { ...teams[1], totalScore: teams[1].totalScore + 1 };
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
