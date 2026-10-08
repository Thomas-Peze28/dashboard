import { fetchForecast, geocodeCity, getCityFromConfig } from './openMeteo.js';
import { describeWeatherCode } from './weatherCodes.js';

/**
* The response from the Open-Meteo current weather API.
**/
interface CurrentWeatherResponse {
    current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        weather_code: number;
        is_day: number;
    };
}

/**
* Retrieves the current weather of a city with Open-Meteo.
* @param config - Widget configuration.
* @returns Current weather data.
**/
export const getCurrentWeather = async (config: Record<string, unknown>) => {

    const location = await geocodeCity(getCityFromConfig(config));
    const { current } = await fetchForecast(location, {
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    }) as CurrentWeatherResponse;

    return {
        city: location.name,
        country: location.country,
        time: current.time,
        temperature: current.temperature_2m,
        apparentTemperature: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        description: describeWeatherCode(current.weather_code),
        isDay: current.is_day === 1,
        units: {
            temperature: '°C',
            humidity: '%',
            windSpeed: 'km/h',
        },
    };
};
