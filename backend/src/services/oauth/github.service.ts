import { syncOAuthUserAndSignJwt } from './oauth.shared.js';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/api/auth/github/callback';

/**
* Generates the GitHub authentication URL.
* @returns The GitHub authentication URL.
**/
export const getGithubAuthUrl = (): string => {

  const rootUrl = 'https://github.com/login/oauth/authorize';

  const options = {
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
  };

  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
};

/**
* Handles the GitHub OAuth callback.
* @param code The authorization code.
* @returns A promise resolving to the signed JWT.
**/
interface GithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

/**
* Represents the response from the GitHub API for user information.
**/
interface GithubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
}

/**
* Represents the response from the GitHub API for user email information.
**/
interface GithubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/**
* Handles the GitHub OAuth callback.
* @param code The authorization code.
* @returns A promise resolving to the signed JWT.
**/
export const handleGithubCallback = async (code: string): Promise<string> => {

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('GITHUB_TOKEN_EXCHANGE_FAILED');
  }

  const tokenData = (await tokenRes.json()) as GithubTokenResponse;

  if (tokenData.error || !tokenData.access_token) {
    throw new Error(`GITHUB_AUTH_ERROR: ${tokenData.error_description || tokenData.error}`);
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('GITHUB_USERINFO_FAILED');
  }

  const githubUser = (await userRes.json()) as GithubUserResponse;

  let userEmail = githubUser.email;

  if (!userEmail) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as GithubEmailResponse[];
      const primaryEmail = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
      userEmail = primaryEmail ? primaryEmail.email : null;
    }
  }

  if (!userEmail) {
    throw new Error('GITHUB_EMAIL_NOT_AVAILABLE');
  }

  return syncOAuthUserAndSignJwt({
    provider: 'github',
    providerAccountId: String(githubUser.id),
    email: userEmail,
    name: githubUser.name ?? githubUser.login,
    accessToken: tokenData.access_token,
    refreshToken: null,
  });
};