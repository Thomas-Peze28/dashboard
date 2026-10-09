const TCGDEX_URL = 'https://api.tcgdex.net/v2';

const LANGUAGES = ['fr', 'en', 'de', 'es', 'it', 'pt', 'ja'] as const;

export type CardLanguage = typeof LANGUAGES[number];

export const DEFAULT_LANGUAGE: CardLanguage = 'fr';

/**
* A card as returned by TCGdex. The image is missing for the cards that have no scan in the requested language.
**/
export interface TcgdexCard {
    id: string;
    name: string;
    image?: string;
    category?: string;
    hp?: number;
    types?: string[];
    stage?: string;
    rarity?: string;
    illustrator?: string;
    set?: { name?: string };
}

/**
* Fetches a JSON payload from TCGdex.
* @param url - The URL to fetch.
* @returns The parsed JSON body, or null if the resource does not exist.
**/
const fetchJson = async (url: URL): Promise<unknown> => {

    let response: Response;

    try {
        response = await fetch(url);
    } catch {
        throw new Error('UPSTREAM_ERROR');
    }

    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error('UPSTREAM_ERROR');
    }
    return response.json();
};

/**
* Reads the card language from a widget configuration, falling back to the default language.
* @param config - The widget configuration.
* @returns The card language.
**/
export const getLanguageFromConfig = (config: Record<string, unknown>): CardLanguage => {
    return LANGUAGES.find((language) => language === config.language) ?? DEFAULT_LANGUAGE;
};

/**
* Fetches a random card.
* @param language - The card language.
* @returns A random card.
**/
export const fetchRandomCard = async (language: CardLanguage): Promise<TcgdexCard> => {

    const card = await fetchJson(new URL(`${TCGDEX_URL}/${language}/random/card`)) as TcgdexCard | null;

    if (!card) {
        throw new Error('UPSTREAM_ERROR');
    }
    return card;
};

/**
* Fetches a card by its TCGdex ID.
* @param id - The TCGdex card ID.
* @param language - The card language.
* @returns The full card, or null if it does not exist in this language.
**/
export const fetchCardById = async (id: string, language: CardLanguage): Promise<TcgdexCard | null> => {
    return await fetchJson(new URL(`${TCGDEX_URL}/${language}/cards/${encodeURIComponent(id)}`)) as TcgdexCard | null;
};

/**
* Formats a TCGdex card for the widgets.
* @param card - The TCGdex card (it must have an image).
* @returns The card data sent to the client.
**/
export const toCardData = (card: TcgdexCard) => ({
    id: card.id,
    name: card.name,
    image: `${card.image}/high.webp`,
});

/**
* Extracts the details of a full TCGdex card. They are written in the card language,
* and each one may be missing (ex: a Trainer card has no HP nor types).
* @param card - The full TCGdex card (the search results do not include these fields).
* @returns The card details sent to the client.
**/
export const toCardDetails = (card: TcgdexCard) => ({
    category: card.category ?? null,
    hp: card.hp ?? null,
    types: card.types ?? [],
    stage: card.stage ?? null,
    rarity: card.rarity ?? null,
    set: card.set?.name ?? null,
    illustrator: card.illustrator ?? null,
});

/**
* Searches a card by name. TCGdex matches partial names, so an exact match is preferred
* (ex: "Pikachu" rather than "Pikachu Volant V"). Cards without an image are left out, as they cannot be displayed.
* @param name - The card name, in the card language.
* @param language - The card language.
* @returns The best matching card, or null if no card matches.
**/
export const searchCard = async (name: string, language: CardLanguage): Promise<TcgdexCard | null> => {

    const url = new URL(`${TCGDEX_URL}/${language}/cards`);
    url.searchParams.set('name', name);

    const results = await fetchJson(url) as TcgdexCard[] | null;
    const cards = (results ?? []).filter((card) => card.image);
    const exactMatch = cards.find((card) => card.name.toLowerCase() === name.toLowerCase());

    return exactMatch ?? cards[0] ?? null;
};
