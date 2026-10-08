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
                        description: 'Number of forecast days (1 to 7)',
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
        ],
    },
];