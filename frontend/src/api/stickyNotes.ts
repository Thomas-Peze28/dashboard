import { isValidTimezone } from '../constants/timezones'
import type {
  GridPosition,
  StickyNote,
  StickyNoteContent,
  StickyNoteContentKind,
  StickyNoteSize,
} from '../types/stickyNote'
import { apiBaseUrl, authHeaders } from './client'

const catalogNames: Record<StickyNoteContentKind, string> = {
  empty: 'sticky_note',
  clock: 'digital_clock',
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
    widget: { name: string }
  }>
}

function toContent(widgetName: string, config: Record<string, unknown> | null): StickyNoteContent | null {
  if (widgetName === catalogNames.empty) return { kind: 'empty' }
  if (widgetName === catalogNames.clock) {
    return { kind: 'clock', timezone: isValidTimezone(config?.timezone) ? config.timezone : 'UTC' }
  }

  return null
}

function toConfig(content: StickyNoteContent) {
  return content.kind === 'clock' ? { timezone: content.timezone } : {}
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
      throw new Error(`Le catalogue ${name} est absent. Lancez make db-seed.`)
    }

    return definition.id
  }

  return {
    widgetIds: {
      empty: findWidgetId(catalogNames.empty),
      clock: findWidgetId(catalogNames.clock),
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
): Promise<StickyNote> {
  const response = await fetch(`${apiBaseUrl}/api/widgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      widgetId: widgetIds[content.kind],
      config: toConfig(content),
      positionX: position.column,
      positionY: position.row,
      width: size.columns,
      height: size.rows,
    }),
  })
  const data = (await response.json()) as { widget?: { id: string }; error?: string }

  if (!response.ok || !data.widget) {
    throw new Error(data.error ?? 'Impossible d’enregistrer le post-it.')
  }

  return { id: data.widget.id, ...position, ...size, content }
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
): Promise<void> {
  await patchStickyNote(
    noteId,
    { widgetId: widgetIds[content.kind], config: toConfig(content) },
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
