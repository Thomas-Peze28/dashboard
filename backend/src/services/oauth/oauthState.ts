import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/env.js';

/**
* The state is signed with its own key, derived from JWT_SECRET:
* a state can never be used as a session token, and a session token can never be used as a state.
**/
const STATE_SECRET = `${JWT_SECRET}:oauth-state`;

/**
* Creates the OAuth "state" parameter, sent to Google / GitHub and checked when they redirect back.
* @param userId - The connected user to link the third-party account to, or nothing for a simple sign-in.
* @returns The signed state, valid for 10 minutes.
**/
export const createOAuthState = (userId?: string): string => {
    return jwt.sign({ userId: userId ?? null }, STATE_SECRET, { expiresIn: '10m' });
};

/**
* Checks the "state" parameter received in the OAuth callback.
* @param state - The state received from Google / GitHub.
* @returns The ID of the user to link the account to, or null for a simple sign-in.
**/
export const readOAuthState = (state: unknown): string | null => {

    if (typeof state !== 'string') {
        throw new Error('OAUTH_INVALID_STATE');
    }

    try {
        const payload = jwt.verify(state, STATE_SECRET) as { userId: string | null };
        return payload.userId;
    } catch {
        throw new Error('OAUTH_INVALID_STATE');
    }
};
