import { Router } from 'express';
import { googleAuthRedirect, googleAuthCallback } from '../controllers/oauth/google.controller.js';
import { githubAuthRedirect, githubAuthCallback } from '../controllers/oauth/github.controller.js';

const router = Router();

router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);
router.get('/github', githubAuthRedirect);
router.get('/github/callback', githubAuthCallback);

export default router;