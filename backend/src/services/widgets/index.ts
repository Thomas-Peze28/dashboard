import { getClockData } from './time/clock.js';
import { getCurrentWeather } from './weather/current.js';
import { getWeatherForecast } from './weather/forecast.js';
import { getGithubRepo } from './github/repo.js';
import { getGithubProfile } from './github/profile.js';
import { getGithubNotifications } from './github/notifications.js';
import { getRandomPokemonCard } from './pokemon/random.js';
import { getPokemonCard } from './pokemon/card.js';

/**
* A widget handler receives the widget configuration and the ID of the user who owns it.
**/
type WidgetHandler = (config: Record<string, unknown>, userId: string) => Promise<unknown>;

/**
* Map of widget handlers.
**/
const WIDGET_HANDLERS: Record<string, WidgetHandler> = {
    clock: getClockData,
    digital_clock: getClockData,
    analog_clock: getClockData,
    weather_current: getCurrentWeather,
    weather_forecast: getWeatherForecast,
    github_repo: getGithubRepo,
    github_profile: getGithubProfile,
    github_notifications: getGithubNotifications,
    pokemon_random_card: getRandomPokemonCard,
    pokemon_card: getPokemonCard,
};

/**
* Executes a widget handler.
* @param widgetName - The name of the widget.
* @param config - The configuration for the widget.
* @param userId - The ID of the user who owns the widget.
* @returns A promise resolving to the result of the widget handler.
**/
export const executeWidgetHandler = async (widgetName: string, config: Record<string, unknown>, userId: string) => {

    const handler = WIDGET_HANDLERS[widgetName];

    if (!handler) {
        throw new Error('NOT_IMPLEMENTED');
    }
    return handler(config, userId);
};