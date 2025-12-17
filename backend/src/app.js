import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import questRoutes from './routes/quests.routes.js';

const app = express();

app.use((req, res, next) => {
  console.log('🔥 BACKEND HIT:', req.method, req.url);
  next();
});
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api', authRoutes);
app.use('/api', questRoutes);

export default app;
