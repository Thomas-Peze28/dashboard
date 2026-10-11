import type { StickyNoteContentKind } from '../types/stickyNote'

// Intervalles proposés, en secondes (le backend refuse moins de 5 secondes).
export const refreshOptions = [
  { seconds: 30, label: '30 secondes' },
  { seconds: 60, label: '1 minute' },
  { seconds: 120, label: '2 minutes' },
  { seconds: 300, label: '5 minutes' },
  { seconds: 600, label: '10 minutes' },
  { seconds: 1800, label: '30 minutes' },
  { seconds: 3600, label: '1 heure' },
]

const defaultRefreshIntervals: Partial<Record<StickyNoteContentKind, number>> = {
  weatherCurrent: 600,
  weatherForecast: 600,
  githubProfile: 600,
  githubRepo: 600,
  githubNotifications: 120,
  gmailUnread: 120,
  gmailRecent: 120,
}

// Les autres widgets (horloge, Pokémon) ne se rafraîchissent pas auprès du backend.
export const supportsRefresh = (kind: StickyNoteContentKind) => kind in defaultRefreshIntervals

export const getDefaultRefreshInterval = (kind: StickyNoteContentKind) => defaultRefreshIntervals[kind]
