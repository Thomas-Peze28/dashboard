import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import aboutRoutes from './routes/about.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import oauthRoutes from './routes/oauth.routes.js';
import serviceRoutes from './routes/service.routes.js';
import docsRoutes from './routes/docs.routes.js';
import { FRONTEND_URL } from './config/env.js';

export const app = express();

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.set('trust proxy', true);

app.use('/', aboutRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);

app.use('/api/users', userRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/services', serviceRoutes);

app.use('/api/docs', docsRoutes);