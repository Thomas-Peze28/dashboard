import type { StickyNoteSize } from '../types/stickyNote'

export const minGmailRecentLimit = 1
export const maxGmailRecentLimit = 6
export const defaultGmailRecentLimit = 6

export const clampGmailRecentLimit = (limit: number) =>
  Math.min(Math.max(limit, minGmailRecentLimit), maxGmailRecentLimit)

// Nombre d'e-mails que le post-it peut afficher : 2 en petit, 4 en moyen, 6 en large.
export const getMaxGmailRecentLimit = ({ columns, rows }: StickyNoteSize) =>
  columns === 1 ? 2 : columns > rows ? maxGmailRecentLimit : 4
