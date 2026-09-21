import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// ABOUT ENDPOINT
app.get('/about.json', (req: Request, res: Response) => {
  let clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  res.status(200).json({
    client: {
      host: clientIp
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: []
    }
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server start on http://0.0.0.0:${PORT}`);
});