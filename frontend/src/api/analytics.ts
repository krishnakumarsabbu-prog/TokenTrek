import api from './client';

export const fetchAnalyticsTotals = () => api.get('/analytics/totals').then(r => r.data);
export const fetchDailyUsage = () => api.get('/analytics/daily-usage').then(r => r.data);
export const fetchPlatformUsage = () => api.get('/analytics/platform-usage').then(r => r.data);
export const fetchDeveloperScores = () => api.get('/analytics/developer-scores').then(r => r.data);
export const fetchPromptRanking = () => api.get('/analytics/prompt-ranking').then(r => r.data);
export const fetchTeamRanking = () => api.get('/analytics/team-ranking').then(r => r.data);
export const fetchModelEfficiency = () => api.get('/analytics/model-efficiency').then(r => r.data);
export const fetchAIWaste = () => api.get('/analytics/ai-waste').then(r => r.data);
export const fetchRecommendations = () => api.get('/analytics/recommendations').then(r => r.data);
export const fetchFullReport = () => api.get('/analytics/report').then(r => r.data);
export const fetchDeveloperXP = () => api.get('/analytics/developer-xp').then(r => r.data);

// Additional endpoints for specific tabs
export const fetchMarketplacePrompts = () => api.get('/analytics/marketplace').then(r => r.data);
export const fetchReplayItems = () => api.get('/analytics/replay').then(r => r.data);
export const fetchReports = () => api.get('/analytics/reports').then(r => r.data);
