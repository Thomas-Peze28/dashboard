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
];