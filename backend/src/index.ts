import 'dotenv/config';
import type { Request, Response } from 'express';
import { app } from './app.js';

const PORT = process.env.PORT || 8080;

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server start on http://0.0.0.0:${PORT}`);
});