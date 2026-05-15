import api from './client';

export const fetchStats = () => api.get('/overview/stats').then(r => r.data);
export const fetchUsageTrend = () => api.get('/overview/usage-trend').then(r => r.data);
export const fetchPlatformCosts = () => api.get('/overview/platform-costs').then(r => r.data);
export const fetchModelCosts = () => api.get('/overview/model-costs').then(r => r.data);
export const fetchTopPrompts = () => api.get('/overview/top-prompts').then(r => r.data);
export const fetchDeveloperScores = () => api.get('/overview/developer-scores').then(r => r.data);
export const fetchTeamCosts = () => api.get('/overview/team-costs').then(r => r.data);
export const fetchLiveActivity = () => api.get('/overview/live-activity').then(r => r.data);
export const fetchWasteItems = () => api.get('/overview/waste-items').then(r => r.data);
export const fetchInsights = () => api.get('/overview/insights').then(r => r.data);
