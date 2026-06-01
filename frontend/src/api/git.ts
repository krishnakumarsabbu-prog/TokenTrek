import api from './client';

export const fetchGitStats = () => api.get('/git/stats').then(r => r.data);
