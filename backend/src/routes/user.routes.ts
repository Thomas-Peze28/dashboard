import { Router } from 'express';
import { getMe } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getMe);

export default router;