import express from 'express';
import cors from 'cors';
import { getDb } from './db';
import { seed } from './seed';
import overviewRouter from './routes/overview';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

getDb();
seed();

app.use('/api/overview', overviewRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[TokenTrek] API → http://localhost:${PORT}`);
});
