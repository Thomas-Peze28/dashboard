import { prisma } from '../../../lib/prisma.js';

const GITHUB_API_URL = 'https://api.github.com';

/**
* Retrieves the GitHub access token stored when the user signed in with GitHub.
* @param userId - The ID of the user.
* @returns The GitHub access token.
**/
export const getGithubToken = async (userId: string): Promise<string> => {

    const account = await prisma.account.findFirst({
        where: { userId, provider: 'github' },
    });

    if (!account?.accessToken) {
        throw new Error('GITHUB_NOT_LINKED');
    }
    return account.accessToken;
};

/**
* Calls the GitHub REST API with the user's token.
* @param path - The API path (ex: /facebook/react).
* @param token - The GitHub access token of the user.
* @returns The parsed JSON body.
**/
export const githubFetch = async (path: string, token: string): Promise<unknown> => {

    let response: Response;

    try {
        response = await fetch(`${GITHUB_API_URL}${path}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Epitech-Dashboard',
            },
        });
    } catch {
        throw new Error('UPSTREAM_ERROR');
    }

    if (response.status === 401) {
        throw new Error('GITHUB_TOKEN_INVALID');
    }
    if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
        throw new Error('GITHUB_RATE_LIMITED');
    }
    if (response.status === 403) {
        throw new Error('GITHUB_FORBIDDEN');
    }
    if (response.status === 404) {
        throw new Error('GITHUB_NOT_FOUND');
    }
    if (!response.ok) {
        throw new Error('UPSTREAM_ERROR');
    }
    return response.json();
};
