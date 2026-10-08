import { fetchForecast, geocodeCity, getCityFromConfig } from './openMeteo.js';
import { describeWeatherCode } from './weatherCodes.js';

const DEFAULT_DAYS = 5;
const MAX_DAYS = 7;

/**
* The response from the Open-Meteo forecast API.
**/
interface ForecastResponse {
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
    };
}

/**
* Reads the number of forecast days from a widget configuration, clamped between 1 and MAX_DAYS.
* @param config - The widget configuration.
* @returns The number of days to fetch.
**/
const getDaysFromConfig = (config: Record<string, unknown>): number => {

    const days = typeof config.days === 'number' || typeof config.days === 'string' ? Number(config.days) : NaN;

    return Number.isInteger(days) ? Math.min(Math.max(days, 1), MAX_DAYS) : DEFAULT_DAYS;
};

/**
* Retrieves the daily forecast of a city with Open-Meteo.
* @param config - Widget configuration ({ city, days }).
* @returns Daily forecast data.
**/
export const getWeatherForecast = async (config: Record<string, unknown>) => {

    const location = await geocodeCity(getCityFromConfig(config));
    const days = getDaysFromConfig(config);
    const { daily } = await fetchForecast(location, {
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
        forecast_days: String(days),
    }) as ForecastResponse;

    return {
        city: location.name,
        country: location.country,
        days: daily.time.map((date, i) => ({
            date,
            weatherCode: daily.weather_code[i] ?? null,
            description: describeWeatherCode(daily.weather_code[i]),
            temperatureMax: daily.temperature_2m_max[i] ?? null,
            temperatureMin: daily.temperature_2m_min[i] ?? null,
            precipitation: daily.precipitation_sum[i] ?? null,
        })),
        units: {
            temperature: '°C',
            precipitation: 'mm',
        },
    };
};
