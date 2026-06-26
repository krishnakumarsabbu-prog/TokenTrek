import { Router } from 'express';
import { store } from '../db';

const router = Router();

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function makeDevScores() {
  const developers = store.developers || [];
  const teams = store.teams || [];
  const platforms = store.platforms || [];

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
  const teams = store.teams || [];
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
      size: store.developers.filter(d => d.team_id === team.id).length || 3,
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

router.get('/team-leaderboard', (_req, res) => {
  res.json(makeTeamScores());
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

export default router;
