import { fetchRandomCard, getLanguageFromConfig, toCardData, toCardDetails } from './tcgdex.js';

/**
* Some cards have no image (about a third in French): a few draws are needed to find one that can be displayed.
**/
const MAX_DRAWS = 5;

/**
* Retrieves a random Pokémon card with TCGdex.
* @param config - Widget configuration ({ language }).
* @returns Random card data, with the details of the card.
**/
export const getRandomPokemonCard = async (config: Record<string, unknown>) => {

    const language = getLanguageFromConfig(config);

    for (let draw = 0; draw < MAX_DRAWS; draw++) {
        const card = await fetchRandomCard(language);

        if (card.image) {
            return { ...toCardData(card), ...toCardDetails(card) };
        }
    }
    throw new Error('UPSTREAM_ERROR');
};
