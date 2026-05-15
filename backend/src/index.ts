import express from 'express';
import cors from 'cors';
import { seed } from './seed';
import overviewRouter from './routes/overview';
import dataRouter from './routes/data';
import analyticsRouter from './routes/analytics';
import leagueRouter from './routes/league';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

seed();

app.use('/api/overview', overviewRouter);
app.use('/api/data', dataRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/league', leagueRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[TokenTrek] API → http://localhost:${PORT}`);
});
