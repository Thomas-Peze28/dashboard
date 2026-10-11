export interface WidgetParamConfig {
    name: string;
    type: 'string' | 'integer' | 'boolean' | 'float';
    description: string;
}

export interface WidgetConfig {
    name: string;
    description: string;
    params: WidgetParamConfig[];
}

export interface ServiceConfig {
    name: string;
    description: string;
    widgets: WidgetConfig[];
}

export const AVAILABLE_SERVICES: ServiceConfig[] = [
    {
        name: 'time',
        description: "Display the current time and timezones.",
        widgets: [
            {
                name: 'digital_clock',
                description: "Digital clock displaying the current time.",
                params: [
                    {
                        name: 'timezone',
                        type: 'string',
                        description: 'IANA Timezone (ex: Europe/Paris, America/New_York)',
                    },
                ],
            },
            {
                name: 'analog_clock',
                description: "Analog clock with a dial and hands.",
                params: [
                    {
                        name: 'timezone',
                        type: 'string',
                        description: 'IANA Timezone (ex: Europe/Paris, America/New_York)',
                    },
                ],
            },
        ],
    },
    {
        name: 'weather',
        description: "Display weather conditions and forecasts with Open-Meteo.",
        widgets: [
            {
                name: 'weather_current',
                description: "Current weather conditions of a city.",
                params: [
                    {
                        name: 'city',
                        type: 'string',
                        description: 'City name (ex: Lille, Paris, Tokyo)',
                    },
                ],
            },
            {
                name: 'weather_forecast',
                description: "Daily weather forecast of a city.",
                params: [
                    {
                        name: 'city',
                        type: 'string',
                        description: 'City name (ex: Lille, Paris, Tokyo)',
                    },
                    {
                        name: 'days',
                        type: 'integer',
                        description: 'Number of forecast days (1 to 10, 5 by default)',
                    },
                ],
            },
        ],
    },
    {
        name: 'github',
        description: "Follow GitHub repositories, profiles and notifications (requires a linked GitHub account).",
        widgets: [
            {
                name: 'github_repo',
                description: "Statistics of a GitHub repository.",
                params: [
                    {
                        name: 'repository',
                        type: 'string',
                        description: 'Repository in owner/repo format (ex: facebook/react)',
                    },
                ],
            },
            {
                name: 'github_profile',
                description: "Public information of a GitHub user or organization.",
                params: [
                    {
                        name: 'username',
                        type: 'string',
                        description: 'GitHub username (ex: Steve_Jobs). Leave empty to display your own profile',
                    },
                ],
            },
            {
                name: 'github_notifications',
                description: "Your unread GitHub notifications.",
                params: [
                    {
                        name: 'limit',
                        type: 'integer',
                        description: 'Maximum number of notifications to display (1 to 8)',
                    },
                ],
            },
        ],
    },
    {
        name: 'pokemon',
        description: "Display Pokémon Trading Card Game cards with TCGdex.",
        widgets: [
            {
                name: 'pokemon_random_card',
                description: "A random Pokémon card, renewed on each refresh.",
                params: [
                    {
                        name: 'language',
                        type: 'string',
                        description: 'Card language: fr, en, de, es, it, pt or ja (fr by default)',
                    },
                ],
            },
            {
                name: 'pokemon_card',
                description: "A Pokémon card chosen by the user.",
                params: [
                    {
                        name: 'name',
                        type: 'string',
                        description: 'Card name, in the card language (ex: Dracaufeu in French, Charizard in English)',
                    },
                    {
                        name: 'id',
                        type: 'string',
                        description: 'Optional TCGdex card ID (ex: base1-4): displays this exact card instead of searching by name',
                    },
                    {
                        name: 'language',
                        type: 'string',
                        description: 'Card language: fr, en, de, es, it, pt or ja (fr by default)',
                    },
                ],
            },
        ],
    },
    {
        name: 'gmail',
        description: "Follow your Gmail inbox (requires a linked Google account).",
        widgets: [
            {
                name: 'gmail_unread_count',
                description: "Number of unread messages in your inbox.",
                params: [],
            },
            {
                name: 'gmail_recent_threads',
                description: "Senders and subjects of the last e-mails received in your inbox.",
                params: [
                    {
                        name: 'limit',
                        type: 'integer',
                        description: 'Number of e-mails to display (1 to 20, 5 by default)',
                    },
                ],
            },
        ],
    },
];