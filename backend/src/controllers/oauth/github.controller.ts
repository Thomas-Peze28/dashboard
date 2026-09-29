import type { Request, Response } from 'express';
import { getGithubAuthUrl, handleGithubCallback } from '../../services/oauth/github.service.js';

/**
* Redirects the user to the GitHub authentication page.
* @param req The request object.
* @param res The response object.
**/
export const githubAuthRedirect = (_req: Request, res: Response): void => {

  const url = getGithubAuthUrl();

  res.redirect(url);
};

/**
* Handles the GitHub OAuth callback.
* @param req The request object.
* @param res The response object.
**/
export const githubAuthCallback = async (req: Request, res: Response): Promise<void> => {

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {

    const { code } = req.query;

    if (typeof code !== 'string') {
      res.redirect(`${frontendUrl}/login?error=missing_code`);
      return;
    }

    const token = await handleGithubCallback(code);

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth GitHub Error:', error);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};