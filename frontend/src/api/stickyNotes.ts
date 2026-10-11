import { defaultPokemonLanguage, isPokemonLanguage } from '../constants/pokemon'
import { isValidTimezone } from '../constants/timezones'
import { clampGithubNotificationsLimit, defaultGithubNotificationsLimit } from '../constants/github'
import { clampGmailRecentLimit, defaultGmailRecentLimit } from '../constants/gmail'
import { clampForecastDays, defaultCity, defaultForecastDays } from '../constants/weather'
import type {
  GridPosition,
  StickyNote,
  StickyNoteContent,
  StickyNoteContentKind,
  StickyNoteSize,
} from '../types/stickyNote'
import { apiBaseUrl, authHeaders } from './client'

const catalogNames: Record<StickyNoteContentKind, string> = {
  clock: 'digital_clock',
  weatherCurrent: 'weather_current',
  weatherForecast: 'weather_forecast',
  pokemonRandom: 'pokemon_random_card',
  pokemonCard: 'pokemon_card',
  githubProfile: 'github_profile',
  githubRepo: 'github_repo',
  githubNotifications: 'github_notifications',
  gmailUnread: 'gmail_unread_count',
  gmailRecent: 'gmail_recent_threads',
}

export type StickyNoteWidgetIds = Record<StickyNoteContentKind, string>

type ServiceCatalogResponse = {
  services: Array<{ widgets: Array<{ id: string; name: string }> }>
}

type UserWidgetsResponse = {
  widgets: Array<{
    id: string
    positionX: number
    positionY: number
    width: number
    height: number
    config: Record<string, unknown> | null
    refreshInterval: number
    widget: { name: string }
  }>
}

function toContent(widgetName: string, config: Record<string, unknown> | null): StickyNoteContent | null {
  if (widgetName === catalogNames.clock) {
    return { kind: 'clock', timezone: isValidTimezone(config?.timezone) ? config.timezone : 'UTC' }
  }
  if (widgetName === catalogNames.githubProfile) {
    return { kind: 'githubProfile', username: typeof config?.username === 'string' ? config.username.trim() : '' }
  }
  if (widgetName === catalogNames.gmailUnread) return { kind: 'gmailUnread' }

  const limit = Number(config?.limit)

  if (widgetName === catalogNames.githubNotifications) {
    return {
      kind: 'githubNotifications',
      limit: Number.isInteger(limit) ? clampGithubNotificationsLimit(limit) : defaultGithubNotificationsLimit,
    }
  }
  if (widgetName === catalogNames.gmailRecent) {
    return {
      kind: 'gmailRecent',
      limit: Number.isInteger(limit) ? clampGmailRecentLimit(limit) : defaultGmailRecentLimit,
    }
  }
  if (widgetName === catalogNames.githubRepo) {
    return { kind: 'githubRepo', repository: typeof config?.repository === 'string' ? config.repository : '' }
  }

  const language = isPokemonLanguage(config?.language) ? config.language : defaultPokemonLanguage

  if (widgetName === catalogNames.pokemonRandom) return { kind: 'pokemonRandom', language }
  if (widgetName === catalogNames.pokemonCard) {
    const name = typeof config?.name === 'string' ? config.name : ''

    if (typeof config?.id === 'string') return { kind: 'pokemonCard', language, name, cardId: config.id }
    return { kind: 'pokemonCard', language, name }
  }

  const city = typeof config?.city === 'string' && config.city.trim() !== '' ? config.city.trim() : defaultCity

  if (widgetName === catalogNames.weatherCurrent) return { kind: 'weatherCurrent', city }
  if (widgetName === catalogNames.weatherForecast) {
    const days = Number(config?.days)

    return {
      kind: 'weatherForecast',
      city,
      days: Number.isInteger(days) ? clampForecastDays(days) : defaultForecastDays,
    }
  }

  return null
}

function toConfig(content: StickyNoteContent) {
  switch (content.kind) {
    case 'clock':
      return { timezone: content.timezone }
    case 'weatherCurrent':
      return { city: content.city }
    case 'weatherForecast':
      return { city: content.city, days: content.days }
    case 'pokemonRandom':
      return { language: content.language }
    case 'githubProfile':
      // Sans nom d'utilisateur, le backend affiche le profil du compte GitHub relié.
      return content.username ? { username: content.username } : {}
    case 'gmailUnread':
      return {}
    case 'gmailRecent':
    case 'githubNotifications':
      return { limit: content.limit }
    case 'githubRepo':
      return { repository: content.repository }
    case 'pokemonCard':
      return content.cardId
        ? { id: content.cardId, name: content.name, language: content.language }
        : { name: content.name, language: content.language }
  }
}

function getWidgetId(widgetIds: StickyNoteWidgetIds, content: StickyNoteContent) {
  const widgetId = widgetIds[content.kind] as string | undefined

  if (!widgetId) {
    throw new Error('Ce widget est absent du catalogue chargé. Rechargez la page.')
  }

  return widgetId
}

export async function fetchStickyNotes(): Promise<{ widgetIds: StickyNoteWidgetIds; notes: StickyNote[] }> {
  const headers = authHeaders()
  const [servicesResponse, widgetsResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/services`, { headers }),
    fetch(`${apiBaseUrl}/api/widgets`, { headers }),
  ])

  if (!servicesResponse.ok || !widgetsResponse.ok) {
    throw new Error('Impossible de charger les post-it.')
  }

  const servicesData = (await servicesResponse.json()) as ServiceCatalogResponse
  const widgetsData = (await widgetsResponse.json()) as UserWidgetsResponse
  const catalog = servicesData.services.flatMap((service) => service.widgets)
  const findWidgetId = (name: string) => {
    const definition = catalog.find((widget) => widget.name === name)

    if (!definition) {
      throw new Error(`Le catalogue ${name} est absent. Relancez le backend pour le remplir.`)
    }

    return definition.id
  }

  return {
    widgetIds: {
      clock: findWidgetId(catalogNames.clock),
      weatherCurrent: findWidgetId(catalogNames.weatherCurrent),
      weatherForecast: findWidgetId(catalogNames.weatherForecast),
      pokemonRandom: findWidgetId(catalogNames.pokemonRandom),
      pokemonCard: findWidgetId(catalogNames.pokemonCard),
      githubProfile: findWidgetId(catalogNames.githubProfile),
      githubRepo: findWidgetId(catalogNames.githubRepo),
      githubNotifications: findWidgetId(catalogNames.githubNotifications),
      gmailUnread: findWidgetId(catalogNames.gmailUnread),
      gmailRecent: findWidgetId(catalogNames.gmailRecent),
    },
    notes: widgetsData.widgets.flatMap((widget) => {
      const content = toContent(widget.widget.name, widget.config)
      if (!content) return []

      return [
        {
          id: widget.id,
          row: widget.positionY,
          column: widget.positionX,
          columns: widget.width,
          rows: widget.height,
          content,
          refreshInterval: widget.refreshInterval,
        },
      ]
    }),
  }
}

export async function createStickyNote(
  widgetIds: StickyNoteWidgetIds,
  position: GridPosition,
  size: StickyNoteSize,
  content: StickyNoteContent,
  refreshInterval?: number,
): Promise<StickyNote> {
  const response = await fetch(`${apiBaseUrl}/api/widgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      widgetId: getWidgetId(widgetIds, content),
      config: toConfig(content),
      refreshInterval,
      positionX: position.column,
      positionY: position.row,
      width: size.columns,
      height: size.rows,
    }),
  })
  const data = (await response.json()) as { widget?: { id: string; refreshInterval: number }; error?: string }

  if (!response.ok || !data.widget) {
    throw new Error(data.error ?? 'Impossible d’enregistrer le post-it.')
  }

  return { id: data.widget.id, ...position, ...size, content, refreshInterval: data.widget.refreshInterval }
}

async function patchStickyNote(noteId: string, body: Record<string, unknown>, fallbackError: string) {
  const response = await fetch(`${apiBaseUrl}/api/widgets/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? fallbackError)
  }
}

export async function moveStickyNote(noteId: string, position: GridPosition): Promise<void> {
  await patchStickyNote(
    noteId,
    { positionX: position.column, positionY: position.row },
    'Impossible de déplacer le post-it.',
  )
}

export async function resizeStickyNote(noteId: string, size: StickyNoteSize): Promise<void> {
  await patchStickyNote(
    noteId,
    { width: size.columns, height: size.rows },
    'Impossible de modifier le post-it.',
  )
}

export async function changeStickyNoteContent(
  widgetIds: StickyNoteWidgetIds,
  noteId: string,
  content: StickyNoteContent,
  refreshInterval?: number,
): Promise<void> {
  await patchStickyNote(
    noteId,
    { widgetId: getWidgetId(widgetIds, content), config: toConfig(content), refreshInterval },
    'Impossible de modifier le post-it.',
  )
}

export async function removeStickyNote(noteId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/widgets/${noteId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Impossible de supprimer le post-it.')
  }
}

export async function fetchStickyNoteData<T>(noteId: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/widgets/${noteId}/data`, { headers: authHeaders() })
  const body = (await response.json().catch(() => ({}))) as { data?: T; error?: string }

  if (!response.ok || body.data === undefined) {
    throw new Error(body.error ?? 'Impossible de charger les données du widget.')
  }

  return body.data
}
