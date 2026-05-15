import client from './client';

export interface DevLeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  team: string;
  platform: string;
  totalScore: number;
  tokenEfficiency: number;
  promptSuccessRate: number;
  codeAcceptance: number;
  modelOptimization: number;
  productivityGain: number;
  costSaved: number;
  promptsCreated: number;
  adoptionScore: number;
  weeklyChange: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  name: string;
  size: number;
  totalScore: number;
  tokenEfficiency: number;
  promptSuccessRate: number;
  codeAcceptance: number;
  modelOptimization: number;
  productivityGain: number;
  costSaved: number;
  adoptionScore: number;
  weeklyChange: number;
}

export interface Champions {
  weekly: { developer: DevLeaderboardEntry; team: TeamLeaderboardEntry };
  monthly: { developer: DevLeaderboardEntry; team: TeamLeaderboardEntry };
  special: {
    bestPromptCreator: DevLeaderboardEntry;
    highestCostSaver: DevLeaderboardEntry;
    topAIAdopter: DevLeaderboardEntry;
  };
}

export async function fetchDevLeaderboard(): Promise<DevLeaderboardEntry[]> {
  const { data } = await client.get('/league/developer-leaderboard');
  return data;
}

export async function fetchTeamLeaderboard(): Promise<TeamLeaderboardEntry[]> {
  const { data } = await client.get('/league/team-leaderboard');
  return data;
}

export async function fetchChampions(): Promise<Champions> {
  const { data } = await client.get('/league/champions');
  return data;
}
