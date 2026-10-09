import type { PokemonLanguage } from '../constants/pokemon'

export type GridPosition = {
  row: number
  column: number
}

export type StickyNoteSize = {
  columns: number
  rows: number
}

export type StickyNoteContent =
  | { kind: 'clock'; timezone: string }
  | { kind: 'weatherCurrent'; city: string }
  | { kind: 'weatherForecast'; city: string; days: number }
  | { kind: 'pokemonRandom'; language: PokemonLanguage }
  // Profil du compte GitHub relié à l'utilisateur.
  | { kind: 'githubProfile' }
  // repository au format propriétaire/dépôt (ex : facebook/react).
  | { kind: 'githubRepo'; repository: string }
  // Avec cardId : carte exacte gardée en favori. Sans : carte cherchée par son nom.
  | { kind: 'pokemonCard'; language: PokemonLanguage; name: string; cardId?: string }

export type StickyNoteContentKind = StickyNoteContent['kind']

export type StickyNote = GridPosition & StickyNoteSize & { id: string; content: StickyNoteContent }
