import api from './client';

export const fetchDevinStats = () => api.get('/devin/stats').then(r => r.data);
export const fetchDevinDevelopers = () => api.get('/devin/developers').then(r => r.data);
export const fetchDevinTeams = () => api.get('/devin/teams').then(r => r.data);
export const fetchDevinTrends = () => api.get('/devin/trends').then(r => r.data);
export const fetchDevinCategories = () => api.get('/devin/categories').then(r => r.data);

export const uploadDevinTelemetry = (payload: { team_name: string; sessions: any[] }) =>
  api.post('/devin/upload', payload).then(r => r.data);
