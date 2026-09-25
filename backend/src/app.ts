import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import aboutRoutes from './routes/about.routes.js';
import widgetRoutes from './routes/widget.routes.js';

export const app = express();

app.use(express.json());

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

app.use('/', aboutRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/widgets', widgetRoutes);