import type { Request, Response } from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../../services/oauth/google.service.js';

/**
* Redirects the user to the Google authentication page.
* @param req The request object.
* @param res The response object.
**/
export const googleAuthRedirect = (_req: Request, res: Response): void => {

  const url = getGoogleAuthUrl();

  res.redirect(url);
};

/**
* Handles the Google OAuth callback.
* @param req The request object.
* @param res The response object.
**/
export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {

    const { code } = req.query;

    if (typeof code !== 'string') {
      res.redirect(`${frontendUrl}/login?error=missing_code`);
      return;
    }

    const token = await handleGoogleCallback(code);

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth Google Error:', error);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};