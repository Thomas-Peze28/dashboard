import { getGithubToken, githubFetch } from './githubApi.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

/**
* The response from the GitHub user API.
**/
interface GithubProfileResponse {
    login: string;
    name: string | null;
    type: string;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
}

/**
* Retrieves a GitHub profile, or the profile of the linked account when no username is configured.
* @param config - Widget configuration.
* @param userId - The ID of the user who owns the widget.
* @returns Profile data.
**/
export const getGithubProfile = async (config: Record<string, unknown>, userId: string) => {

    if (config.username !== undefined && typeof config.username !== 'string') {
        throw new Error('INVALID_WIDGET_CONFIG');
    }

    const username = config.username?.trim() ?? '';

    if (username !== '' && !USERNAME_PATTERN.test(username)) {
        throw new Error('INVALID_WIDGET_CONFIG');
    }

    const token = await getGithubToken(userId);
    const path = username === '' ? '/user' : `/users/${username}`;
    const profile = await githubFetch(path, token) as GithubProfileResponse;

    return {
        login: profile.login,
        name: profile.name,
        type: profile.type,
        avatarUrl: profile.avatar_url,
        url: profile.html_url,
        bio: profile.bio,
        company: profile.company,
        location: profile.location,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        createdAt: profile.created_at,
    };
};
