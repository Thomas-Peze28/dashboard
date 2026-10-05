import type { GridPosition, StickyNote, StickyNoteSize } from '../types/stickyNote'
import { apiBaseUrl, authHeaders } from './client'

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
    widget: { name: string }
  }>
}

export async function fetchStickyNotes(): Promise<{ widgetId: string; notes: StickyNote[] }> {
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
  const noteDefinition = servicesData.services
    .flatMap((service) => service.widgets)
    .find((widget) => widget.name === 'sticky_note')

  if (!noteDefinition) {
    throw new Error('Le catalogue sticky_note est absent. Lancez make db-seed.')
  }

  return {
    widgetId: noteDefinition.id,
    notes: widgetsData.widgets
      .filter((widget) => widget.widget.name === 'sticky_note')
      .map((widget) => ({
        id: widget.id,
        row: widget.positionY,
        column: widget.positionX,
        columns: widget.width,
        rows: widget.height,
      })),
  }
}

export async function createStickyNote(
  widgetId: string,
  position: GridPosition,
  size: StickyNoteSize,
): Promise<StickyNote> {
  const response = await fetch(`${apiBaseUrl}/api/widgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      widgetId,
      config: {},
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

  return { id: data.widget.id, ...position, ...size }
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
