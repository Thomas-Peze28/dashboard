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
  | { kind: 'pokemonCard'; language: PokemonLanguage; cardId: string; name: string }

export type StickyNoteContentKind = StickyNoteContent['kind']

export type StickyNote = GridPosition & StickyNoteSize & { id: string; content: StickyNoteContent }
