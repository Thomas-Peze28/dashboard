import { prisma } from '../../../lib/prisma.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
* The response from the Google token endpoint when a token is refreshed.
**/
interface GoogleRefreshResponse {
    access_token: string;
    expires_in: number;
}

/**
* Gets a new access token with the refresh token stored when the user signed in with Google.
* @param accountId - The ID of the Google account in the database.
* @param refreshToken - The Google refresh token.
* @returns The new access token.
**/
const refreshGoogleToken = async (accountId: string, refreshToken: string): Promise<string> => {

    let response: Response;

    try {
        response = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
    } catch {
        throw new Error('UPSTREAM_ERROR');
    }

    if (response.status === 400 || response.status === 401) {
        throw new Error('GOOGLE_TOKEN_INVALID');
    }
    if (!response.ok) {
        throw new Error('UPSTREAM_ERROR');
    }

    const data = await response.json() as GoogleRefreshResponse;

    await prisma.account.update({
        where: { id: accountId },
        data: {
            accessToken: data.access_token,
            expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
        },
    });
    return data.access_token;
};

/**
* Retrieves a valid Google access token of the user, refreshing it if it has expired.
* @param userId - The ID of the user.
* @returns The Google access token.
**/
export const getGoogleToken = async (userId: string): Promise<string> => {

    const account = await prisma.account.findFirst({
        where: { userId, provider: 'google' },
    });

    if (!account?.accessToken) {
        throw new Error('GOOGLE_NOT_LINKED');
    }

    const now = Math.floor(Date.now() / 1000);

    if (account.expiresAt === null || account.expiresAt > now + 60) {
        return account.accessToken;
    }
    if (!account.refreshToken) {
        throw new Error('GOOGLE_TOKEN_INVALID');
    }
    return refreshGoogleToken(account.id, account.refreshToken);
};

/**
* Calls a Google API with the user's token.
* @param url - The full URL of the API endpoint.
* @param token - The Google access token of the user.
* @returns The parsed JSON body.
**/
export const googleFetch = async (url: string, token: string): Promise<unknown> => {

    let response: Response;

    try {
        response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        throw new Error('UPSTREAM_ERROR');
    }

    if (response.status === 401) {
        throw new Error('GOOGLE_TOKEN_INVALID');
    }
    if (response.status === 429) {
        throw new Error('GOOGLE_RATE_LIMITED');
    }
    if (response.status === 403) {
        throw new Error('GOOGLE_FORBIDDEN');
    }
    if (!response.ok) {
        throw new Error('UPSTREAM_ERROR');
    }
    return response.json();
};
