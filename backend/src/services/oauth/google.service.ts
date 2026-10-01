import { syncOAuthUserAndSignJwt } from './oauth.shared.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/auth/google/callback';

/**
* Generates the Google authentication URL.
* @returns The Google authentication URL.
**/
export const getGoogleAuthUrl = (): string => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
};

/**
* Exchanges the authorization code for an access token.
* @param code The authorization code.
* @returns The Google token response.
**/
interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/**
* Represents the Google user information.
* @param id The user's ID.
* @param email The user's email.
* @param name The user's name.
**/
interface GoogleUserResponse {
  id: string;
  email: string;
  name: string;
}

/**
* Handles the Google OAuth callback.
* @param code The authorization code.
* @returns The JWT token.
**/
export const handleGoogleCallback = async (code: string): Promise<string> => {

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');
  }

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('GOOGLE_USERINFO_FAILED');
  }

  const googleUser = (await userRes.json()) as GoogleUserResponse;

  return syncOAuthUserAndSignJwt({
    provider: 'google',
    providerAccountId: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? null,
    expiresIn: tokenData.expires_in,
  });
};