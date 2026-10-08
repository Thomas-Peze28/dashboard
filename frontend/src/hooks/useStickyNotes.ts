import { useEffect, useState } from 'react'
import {
  changeStickyNoteContent,
  createStickyNote,
  fetchStickyNotes,
  moveStickyNote,
  removeStickyNote,
  resizeStickyNote,
} from '../api/stickyNotes'
import type { StickyNoteWidgetIds } from '../api/stickyNotes'
import { gridColumns, gridRows } from '../constants/grid'
import type { GridPosition, StickyNote, StickyNoteContent, StickyNoteSize } from '../types/stickyNote'

export function useStickyNotes() {
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [stickyNoteWidgetIds, setStickyNoteWidgetIds] = useState<StickyNoteWidgetIds | null>(null)
  const [isLoadingStickyNotes, setIsLoadingStickyNotes] = useState(true)
  const [isSavingStickyNote, setIsSavingStickyNote] = useState(false)
  const [deletingStickyNoteId, setDeletingStickyNoteId] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    let isCancelled = false
    const loadStickyNotes = async () => {
      try {
        const { widgetIds, notes } = await fetchStickyNotes()

        if (isCancelled) return

        setStickyNoteWidgetIds(widgetIds)
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

  // ignoredNoteId permet de ne pas compter le post-it qu'on est en train de déplacer.
  const canPlaceStickyNote = (position: GridPosition, size: StickyNoteSize, ignoredNoteId?: string) => {
    if (position.column < 0 || position.row < 0) return false
    if (position.column + size.columns > gridColumns) return false
    if (position.row + size.rows > gridRows) return false

    return stickyNotes.every(
      (note) =>
        note.id === ignoredNoteId ||
        position.row >= note.row + note.rows ||
        note.row >= position.row + size.rows ||
        position.column >= note.column + note.columns ||
        note.column >= position.column + size.columns,
    )
  }

  // Renvoie true si le post-it a bien été enregistré.
  const addStickyNote = async (position: GridPosition, size: StickyNoteSize, content: StickyNoteContent) => {
    if (!stickyNoteWidgetIds || !canPlaceStickyNote(position, size)) return false

    setIsSavingStickyNote(true)
    setDashboardError('')

    try {
      const createdNote = await createStickyNote(stickyNoteWidgetIds, position, size, content)
      setStickyNotes((current) => [...current, createdNote])
      return true
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Impossible d’enregistrer le post-it.')
      return false
    } finally {
      setIsSavingStickyNote(false)
    }
  }

  const relocateStickyNote = async (noteId: string, position: GridPosition) => {
    const note = stickyNotes.find((current) => current.id === noteId)

    if (!note || !canPlaceStickyNote(position, note, noteId)) return
    if (note.row === position.row && note.column === position.column) return

    const setPosition = ({ row, column }: GridPosition) =>
      setStickyNotes((current) =>
        current.map((item) => (item.id === noteId ? { ...item, row, column } : item)),
      )

    // On déplace tout de suite à l'écran, et on revient en arrière si l'enregistrement échoue.
    setPosition(position)
    setDashboardError('')

    try {
      await moveStickyNote(noteId, position)
    } catch (error) {
      setPosition(note)
      setDashboardError(error instanceof Error ? error.message : 'Impossible de déplacer le post-it.')
    }
  }

  // Renvoie true si la modification a bien été enregistrée.
  const saveStickyNoteChange = async (noteId: string, changes: Partial<StickyNote>, save: () => Promise<void>) => {
    setIsSavingStickyNote(true)
    setDashboardError('')

    try {
      await save()
      setStickyNotes((current) => current.map((note) => (note.id === noteId ? { ...note, ...changes } : note)))
      return true
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Impossible de modifier le post-it.')
      return false
    } finally {
      setIsSavingStickyNote(false)
    }
  }

  const changeStickyNoteSize = async (noteId: string, size: StickyNoteSize) => {
    const note = stickyNotes.find((current) => current.id === noteId)
    if (!note || !canPlaceStickyNote(note, size, noteId)) return false

    return saveStickyNoteChange(noteId, { columns: size.columns, rows: size.rows }, () =>
      resizeStickyNote(noteId, size),
    )
  }

  const changeStickyNoteWidget = async (noteId: string, content: StickyNoteContent) => {
    if (!stickyNoteWidgetIds) return false

    return saveStickyNoteChange(noteId, { content }, () =>
      changeStickyNoteContent(stickyNoteWidgetIds, noteId, content),
    )
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
    canAddStickyNote: !isLoadingStickyNotes && Boolean(stickyNoteWidgetIds),
    isSavingStickyNote,
    deletingStickyNoteId,
    dashboardError,
    isCellOccupied,
    canPlaceStickyNote,
    addStickyNote,
    relocateStickyNote,
    changeStickyNoteSize,
    changeStickyNoteWidget,
    deleteStickyNote,
  }
}
