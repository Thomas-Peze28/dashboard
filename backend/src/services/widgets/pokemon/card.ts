import { fetchCardById, getLanguageFromConfig, searchCard, toCardData, toCardDetails } from './tcgdex.js';

/**
* Retrieves a Pokémon card chosen by the user with TCGdex.
* @param config - Widget configuration ({ name, language }, or { id, language } to keep one exact card).
* @returns Card data.
**/
export const getPokemonCard = async (config: Record<string, unknown>) => {

    const id = typeof config.id === 'string' ? config.id.trim() : '';

    if (id !== '') {
        const card = await fetchCardById(id, getLanguageFromConfig(config));

        if (!card?.image) {
            throw new Error('POKEMON_CARD_NOT_FOUND');
        }
        return { ...toCardData(card), ...toCardDetails(card) };
    }

    const name = typeof config.name === 'string' ? config.name.trim() : '';

    if (name === '') {
        throw new Error('INVALID_WIDGET_CONFIG');
    }

    const card = await searchCard(name, getLanguageFromConfig(config));

    if (!card) {
        throw new Error('POKEMON_CARD_NOT_FOUND');
    }
    return toCardData(card);
};
