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
  | { kind: 'githubProfile' }
  | { kind: 'githubRepo'; repository: string }
  | { kind: 'githubNotifications' }
  | { kind: 'gmailUnread' }
  | { kind: 'gmailRecent' }
  | { kind: 'pokemonCard'; language: PokemonLanguage; name: string; cardId?: string }

export type StickyNoteContentKind = StickyNoteContent['kind']

export type StickyNote = GridPosition &
  StickyNoteSize & { id: string; content: StickyNoteContent; refreshInterval: number }
