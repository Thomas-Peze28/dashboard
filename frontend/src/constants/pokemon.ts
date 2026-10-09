export const pokemonLanguages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'de', label: 'Allemand' },
  { code: 'es', label: 'Espagnol' },
  { code: 'it', label: 'Italien' },
  { code: 'pt', label: 'Portugais' },
  { code: 'ja', label: 'Japonais' },
] as const

export type PokemonLanguage = (typeof pokemonLanguages)[number]['code']

export const defaultPokemonLanguage: PokemonLanguage = 'fr'

export const isPokemonLanguage = (value: unknown): value is PokemonLanguage =>
  pokemonLanguages.some((language) => language.code === value)
