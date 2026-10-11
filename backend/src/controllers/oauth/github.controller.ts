import type { Request, Response } from 'express';
import { getGithubAuthUrl, handleGithubCallback } from '../../services/oauth/github.service.js';
import { createOAuthState, readOAuthState } from '../../services/oauth/oauthState.js';
import { FRONTEND_URL } from '../../config/env.js';

/**
* Redirects the user to the GitHub authentication page, to sign in.
* @param req The request object.
* @param res The response object.
**/
export const githubAuthRedirect = (_req: Request, res: Response): void => {

  res.redirect(getGithubAuthUrl(createOAuthState()));

};

/**
* Returns the GitHub authentication URL to link a GitHub account to the connected user.
* The frontend calls this route with its JWT, then sends the browser to the returned URL.
* @param req The request object.
* @param res The response object.
**/
export const githubAuthLink = (req: Request, res: Response): void => {

  res.status(200).json({ url: getGithubAuthUrl(createOAuthState(req.user!.userId)) });

};

/**
* Handles the GitHub OAuth callback.
* @param req The request object.
* @param res The response object.
**/
export const githubAuthCallback = async (req: Request, res: Response): Promise<void> => {

  const frontendUrl = FRONTEND_URL;
  let linkUserId: string | null = null;

  try {

    const { code, state } = req.query;

    if (typeof code !== 'string') {
      res.redirect(`${frontendUrl}/login?error=missing_code`);
      return;
    }

    linkUserId = readOAuthState(state);
    const token = await handleGithubCallback(code, linkUserId);

    res.redirect(linkUserId ? `${frontendUrl}/dashboard` : `${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth GitHub Error:', error);
    const reason = error instanceof Error && error.message === 'OAUTH_ACCOUNT_ALREADY_LINKED'
      ? 'account_already_linked'
      : 'oauth_failed';
    res.redirect(linkUserId ? `${frontendUrl}/dashboard?error=${reason}` : `${frontendUrl}/login?error=${reason}`);
  }
};
