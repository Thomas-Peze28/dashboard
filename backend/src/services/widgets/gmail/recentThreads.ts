import { GMAIL_API_URL, getGoogleToken, googleFetch } from '../google/googleApi.js';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

/**
* The response from the Gmail messages list API.
**/
interface GmailMessageListResponse {
    messages?: { id: string }[];
}

/**
* A message from the Gmail messages API.
**/
interface GmailMessageResponse {
    id: string;
    threadId: string;
    labelIds?: string[];
    internalDate: string;
    payload: {
        headers: { name: string; value: string }[];
    };
}

/**
* Reads the number of e-mails from a widget configuration, clamped between 1 and MAX_LIMIT.
* @param config - The widget configuration.
* @returns The number of e-mails to fetch.
**/
const getLimitFromConfig = (config: Record<string, unknown>): number => {

    const limit = typeof config.limit === 'number' || typeof config.limit === 'string' ? Number(config.limit) : NaN;
    return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : DEFAULT_LIMIT;
};

/**
* Reads a header of a message.
* @param message - The Gmail message.
* @param name - The header name (ex: From, Subject).
* @returns The header value, or an empty string if it is missing.
**/
const getHeader = (message: GmailMessageResponse, name: string): string => {

    const header = message.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
    return header?.value ?? '';
};

/**
* Splits a From header into the sender name and address.
* Ex: '"Jane Doe" <jane@example.com>' gives { name: 'Jane Doe', email: 'jane@example.com' }.
* @param from - The From header.
* @returns The sender name (the address when there is no name) and address.
**/
const parseSender = (from: string) => {

    const match = from.match(/^(.*)<(.+)>$/);

    if (!match) {
        return { name: from.trim(), email: from.trim() };
    }

    const name = match[1]!.trim().replace(/^"(.*)"$/, '$1');
    const email = match[2]!.trim();
    return { name: name || email, email };
};

/**
* Retrieves the senders and subjects of the last e-mails received in the Gmail inbox of the user.
* @param config - Widget configuration ({ limit }).
* @param userId - The ID of the user who owns the widget.
* @returns Recent e-mails data.
**/
export const getGmailRecentThreads = async (config: Record<string, unknown>, userId: string) => {

    const limit = getLimitFromConfig(config);
    const token = await getGoogleToken(userId);
    const list = await googleFetch(`${GMAIL_API_URL}/messages?labelIds=INBOX&maxResults=${limit}`, token) as GmailMessageListResponse;

    const messages = await Promise.all((list.messages ?? []).map((message) => googleFetch(
        `${GMAIL_API_URL}/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        token,
    ))) as GmailMessageResponse[];

    return {
        count: messages.length,
        emails: messages.map((message) => {
            const sender = parseSender(getHeader(message, 'From'));

            return {
                id: message.id,
                from: sender.name,
                fromEmail: sender.email,
                subject: getHeader(message, 'Subject'),
                date: new Date(Number(message.internalDate)).toISOString(),
                unread: message.labelIds?.includes('UNREAD') ?? false,
                url: `https://mail.google.com/mail/u/0/#inbox/${message.threadId}`,
            };
        }),
    };
};
