import { Router } from 'express';
import { googleAuthRedirect, googleAuthLink, googleAuthCallback } from '../controllers/oauth/google.controller.js';
import { githubAuthRedirect, githubAuthLink, githubAuthCallback } from '../controllers/oauth/github.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/google', googleAuthRedirect);
router.post('/google/link', requireAuth, googleAuthLink);
router.get('/google/callback', googleAuthCallback);
router.get('/github', githubAuthRedirect);
router.post('/github/link', requireAuth, githubAuthLink);
router.get('/github/callback', githubAuthCallback);

export default router;