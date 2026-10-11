import crypto from 'crypto';

const MIN_JWT_SECRET_LENGTH = 32;

/**
* Reads the key used to sign the session tokens (JWT).
* - Missing key: a random key is generated, so the app still starts but sessions are lost at each restart.
* - Key too short: the server refuses to start, as a guessable key would let anyone forge a session.
* @returns The JWT secret.
**/
const readJwtSecret = (): string => {

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.warn('[WARN] JWT_SECRET is not set: using a random key, sessions will not survive a restart.');
        return crypto.randomBytes(32).toString('hex');
    }
    if (secret.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(
            `JWT_SECRET is too short (${MIN_JWT_SECRET_LENGTH} characters minimum). `
            + 'Generate one with: openssl rand -hex 32',
        );
    }
    return secret;
};

export const JWT_SECRET = readJwtSecret();

/**
* Address of the frontend: the only origin allowed to call the API from a browser (CORS).
**/
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
