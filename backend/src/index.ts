import express from 'express';
import cors from 'cors';
import { loadGitStatsFromCSV } from './seed';
import overviewRouter from './routes/overview';
import dataRouter from './routes/data';
import analyticsRouter from './routes/analytics';
import leagueRouter from './routes/league';
import gitRouter from './routes/git';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Only load real CSV-based git stats — no fake seed data
loadGitStatsFromCSV();

app.use('/api/overview', overviewRouter);
app.use('/api/data', dataRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/league', leagueRouter);
app.use('/api/git', gitRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[TokenTrek] API → http://localhost:${PORT} (store starts empty — no seed data)`);
});
