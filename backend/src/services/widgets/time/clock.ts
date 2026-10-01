/**
* Retrieves clock data with the Native JavaScript Internationalization API.
* @param config - Clock configuration.
* @returns Clock data.
**/
export const getClockData = async (config: Record<string, unknown>) => {

    const timezone = typeof config.timezone === 'string' ? config.timezone : 'UTC';
    const now = new Date();

    return {
        timezone,
        time: new Intl.DateTimeFormat('fr-FR', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(now),
        date: new Intl.DateTimeFormat('fr-FR', {
            timeZone: timezone,
            dateStyle: 'full',
        }).format(now),
    };
};