import { getClockData } from './time/clock.js';
import { getCurrentWeather } from './weather/current.js';
import { getWeatherForecast } from './weather/forecast.js';

/**
* Map of widget handlers.
**/
const WIDGET_HANDLERS: Record<string, (config: Record<string, unknown>) => Promise<unknown>> = {
    clock: getClockData,
    digital_clock: getClockData,
    analog_clock: getClockData,
    weather_current: getCurrentWeather,
    weather_forecast: getWeatherForecast,
};

/**
* Executes a widget handler.
* @param widgetName - The name of the widget.
* @param config - The configuration for the widget.
* @returns A promise resolving to the result of the widget handler.
**/
export const executeWidgetHandler = async (widgetName: string, config: Record<string, unknown>) => {

    const handler = WIDGET_HANDLERS[widgetName];

    if (!handler) {
        throw new Error('NOT_IMPLEMENTED');
    }
    return handler(config);
};