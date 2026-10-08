import { getGithubToken, githubFetch } from './githubApi.js';

const REPOSITORY_PATTERN = /^[\w.-]+\/[\w.-]+$/;

/**
* The response from the GitHub repository API.
**/
interface GithubRepoResponse {
    full_name: string;
    description: string | null;
    html_url: string;
    private: boolean;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    subscribers_count: number;
    default_branch: string;
    pushed_at: string;
    owner: {
        login: string;
        avatar_url: string;
    };
}

/**
* Retrieves the statistics of a GitHub repository.
* @param config - Widget configuration.
* @param userId - The ID of the user who owns the widget.
* @returns Repository data.
**/
export const getGithubRepo = async (config: Record<string, unknown>, userId: string) => {

    const repository = typeof config.repository === 'string' ? config.repository.trim() : '';

    if (!REPOSITORY_PATTERN.test(repository)) {
        throw new Error('INVALID_WIDGET_CONFIG');
    }

    const token = await getGithubToken(userId);
    const repo = await githubFetch(`/repos/${repository}`, token) as GithubRepoResponse;

    return {
        repository: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        owner: {
            login: repo.owner.login,
            avatarUrl: repo.owner.avatar_url,
        },
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        watchers: repo.subscribers_count,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        pushedAt: repo.pushed_at,
    };
};
