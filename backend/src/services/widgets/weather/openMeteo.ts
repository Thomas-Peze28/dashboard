const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export const DEFAULT_CITY = 'Paris';

/**
* Location resolved from a city name by the Open-Meteo geocoding API.
**/
export interface GeoLocation {
    name: string;
    country: string | null;
    latitude: number;
    longitude: number;
}

interface GeocodingResponse {
    results?: {
        name: string;
        country?: string;
        latitude: number;
        longitude: number;
    }[];
}

/**
* Geocoding results never change, so they are cached to avoid one extra call per widget refresh.
**/
const geocodingCache = new Map<string, GeoLocation>();

/**
* Fetches a JSON payload from Open-Meteo.
* @param url - The URL to fetch.
* @returns The parsed JSON body.
**/
const fetchJson = async (url: URL): Promise<unknown> => {

    let response: Response;

    try {
        response = await fetch(url);
    } catch {
        throw new Error('UPSTREAM_ERROR');
    }

    if (!response.ok) {
        throw new Error('UPSTREAM_ERROR');
    }
    return response.json();
};

/**
* Reads the city from a widget configuration, falling back to the default city.
* @param config - The widget configuration.
* @returns The trimmed city name.
**/
export const getCityFromConfig = (config: Record<string, unknown>): string => {
    return typeof config.city === 'string' && config.city.trim() !== '' ? config.city.trim() : DEFAULT_CITY;
};

/**
* Resolves a city name to coordinates.
* @param city - The city name.
* @returns The location of the best match.
**/
export const geocodeCity = async (city: string): Promise<GeoLocation> => {

    const cacheKey = city.toLowerCase();
    const cached = geocodingCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const url = new URL(GEOCODING_URL);
    url.searchParams.set('name', city);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const body = await fetchJson(url) as GeocodingResponse;
    const match = body.results?.[0];

    if (!match) {
        throw new Error('CITY_NOT_FOUND');
    }

    const location: GeoLocation = {
        name: match.name,
        country: match.country ?? null,
        latitude: match.latitude,
        longitude: match.longitude,
    };

    geocodingCache.set(cacheKey, location);
    return location;
};

/**
* Calls the Open-Meteo forecast API for a location.
* @param location - The location to query.
* @param params - Additional query parameters (current, daily, forecast_days...).
* @returns The parsed forecast response.
**/
export const fetchForecast = async (location: GeoLocation, params: Record<string, string>): Promise<unknown> => {

    const url = new URL(FORECAST_URL);
    url.searchParams.set('latitude', String(location.latitude));
    url.searchParams.set('longitude', String(location.longitude));
    url.searchParams.set('timezone', 'auto');

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    return fetchJson(url);
};

/**
* Clears the geocoding cache (used by tests).
**/
export const clearGeocodingCache = (): void => {
    geocodingCache.clear();
};
