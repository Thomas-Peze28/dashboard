import { GMAIL_API_URL, getGoogleToken, googleFetch } from '../google/googleApi.js';

/**
* The response from the Gmail labels API.
**/
interface GmailLabelResponse {
    messagesUnread?: number;
}

/**
* Retrieves the number of unread messages in the Gmail inbox of the user.
* @param _config - Widget configuration (no parameter).
* @param userId - The ID of the user who owns the widget.
* @returns Unread count data.
**/
export const getGmailUnreadCount = async (_config: Record<string, unknown>, userId: string) => {

    const token = await getGoogleToken(userId);
    const inbox = await googleFetch(`${GMAIL_API_URL}/labels/INBOX`, token) as GmailLabelResponse;

    return {
        unread: inbox.messagesUnread ?? 0,
    };
};
