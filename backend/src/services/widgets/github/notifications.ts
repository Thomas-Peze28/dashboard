import { getGithubToken, githubFetch } from './githubApi.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
* A notification from the GitHub notifications API.
**/
interface GithubNotificationResponse {
    id: string;
    reason: string;
    updated_at: string;
    subject: {
        title: string;
        type: string;
        url: string | null;
    };
    repository: {
        full_name: string;
        html_url: string;
    };
}

/**
* Reads the number of notifications from a widget configuration, clamped between 1 and MAX_LIMIT.
* @param config - The widget configuration.
* @returns The number of notifications to fetch.
**/
const getLimitFromConfig = (config: Record<string, unknown>): number => {

    const limit = typeof config.limit === 'number' || typeof config.limit === 'string' ? Number(config.limit) : NaN;
    return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : DEFAULT_LIMIT;
};

/**
* Converts the API URL of an issue or pull request to its page on github.com.
* Other subjects (releases, discussions...) have no reliable page URL, so they link to the repository.
* @param notification - The GitHub notification.
* @returns The URL to open in a browser.
**/
const getNotificationUrl = (notification: GithubNotificationResponse): string => {

    const match = notification.subject.url?.match(/^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/(issues|pulls)\/(\d+)$/);

    if (!match) {
        return notification.repository.html_url;
    }

    const [ , repository, kind, number] = match;
    return `https://github.com/${repository}/${kind === 'pulls' ? 'pull' : 'issues'}/${number}`;
};

/**
* Retrieves the unread GitHub notifications of the user.
* @param config - Widget configuration.
* @param userId - The ID of the user who owns the widget.
* @returns Notifications data.
**/
export const getGithubNotifications = async (config: Record<string, unknown>, userId: string) => {

    const limit = getLimitFromConfig(config);
    const token = await getGithubToken(userId);
    const notifications = await githubFetch(`/notifications?per_page=${limit}`, token) as GithubNotificationResponse[];

    return {
        count: notifications.length,
        notifications: notifications.map((notification) => ({
            id: notification.id,
            title: notification.subject.title,
            type: notification.subject.type,
            reason: notification.reason,
            repository: notification.repository.full_name,
            url: getNotificationUrl(notification),
            updatedAt: notification.updated_at,
        })),
    };
};
