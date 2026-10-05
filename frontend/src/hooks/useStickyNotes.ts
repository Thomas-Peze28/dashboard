import { useEffect, useState } from 'react'
import { createStickyNote, fetchStickyNotes, removeStickyNote } from '../api/stickyNotes'
import { gridColumns, gridRows } from '../constants/grid'
import type { GridPosition, StickyNote, StickyNoteSize } from '../types/stickyNote'

export function useStickyNotes() {
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [stickyNoteWidgetId, setStickyNoteWidgetId] = useState<string | null>(null)
  const [isLoadingStickyNotes, setIsLoadingStickyNotes] = useState(true)
  const [isSavingStickyNote, setIsSavingStickyNote] = useState(false)
  const [deletingStickyNoteId, setDeletingStickyNoteId] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    let isCancelled = false
    const loadStickyNotes = async () => {
      try {
        const { widgetId, notes } = await fetchStickyNotes()

        if (isCancelled) return

        setStickyNoteWidgetId(widgetId)
        setStickyNotes(notes)
      } catch (error) {
        if (!isCancelled) {
          setDashboardError(error instanceof Error ? error.message : 'Impossible de charger les post-it.')
        }
      } finally {
        if (!isCancelled) setIsLoadingStickyNotes(false)
      }
    }

    void loadStickyNotes()
    return () => {
      isCancelled = true
    }
  }, [])

  const isCellOccupied = ({ row, column }: GridPosition) =>
    stickyNotes.some(
      (note) =>
        row >= note.row &&
        row < note.row + note.rows &&
        column >= note.column &&
        column < note.column + note.columns,
    )

  const canPlaceStickyNote = (position: GridPosition, size: StickyNoteSize) => {
    if (position.column + size.columns > gridColumns) return false
    if (position.row + size.rows > gridRows) return false

    return stickyNotes.every(
      (note) =>
        position.row >= note.row + note.rows ||
        note.row >= position.row + size.rows ||
        position.column >= note.column + note.columns ||
        note.column >= position.column + size.columns,
    )
  }

  // Renvoie true si le post-it a bien été enregistré.
  const addStickyNote = async (position: GridPosition, size: StickyNoteSize) => {
    if (!stickyNoteWidgetId || !canPlaceStickyNote(position, size)) return false

    setIsSavingStickyNote(true)
    setDashboardError('')

    try {
      const createdNote = await createStickyNote(stickyNoteWidgetId, position, size)
      setStickyNotes((current) => [...current, createdNote])
      return true
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Impossible d’enregistrer le post-it.')
      return false
    } finally {
      setIsSavingStickyNote(false)
    }
  }

  const deleteStickyNote = async (noteId: string) => {
    setDeletingStickyNoteId(noteId)
    setDashboardError('')

    try {
      await removeStickyNote(noteId)
      setStickyNotes((current) => current.filter((note) => note.id !== noteId))
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Impossible de supprimer le post-it.')
    } finally {
      setDeletingStickyNoteId(null)
    }
  }

  return {
    stickyNotes,
    canAddStickyNote: !isLoadingStickyNotes && Boolean(stickyNoteWidgetId),
    isSavingStickyNote,
    deletingStickyNoteId,
    dashboardError,
    isCellOccupied,
    canPlaceStickyNote,
    addStickyNote,
    deleteStickyNote,
  }
}
