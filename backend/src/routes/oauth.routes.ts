import { Router } from 'express';
import { googleAuthRedirect, googleAuthCallback } from '../controllers/oauth/google.controller.js';

const router = Router();

router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);

export default router;