import { useState } from 'react'
import liegeImage from '../../assets/liege.jpg'
import { gridColumns, gridRows } from '../../constants/grid'
import { useStickyNotes } from '../../hooks/useStickyNotes'
import type { GridPosition, StickyNoteSize } from '../../types/stickyNote'
import GridCell from './GridCell'
import LogoutButton from './LogoutButton'
import StickyNoteCard from './StickyNoteCard'
import StickyNoteSizeDialog from './StickyNoteSizeDialog'

function Dashboard() {
  const [pendingCell, setPendingCell] = useState<GridPosition | null>(null)
  const {
    stickyNotes,
    canAddStickyNote,
    isSavingStickyNote,
    deletingStickyNoteId,
    dashboardError,
    isCellOccupied,
    canPlaceStickyNote,
    addStickyNote,
    deleteStickyNote,
  } = useStickyNotes()

  const handleSelectSize = async (size: StickyNoteSize) => {
    if (!pendingCell) return
    if (await addStickyNote(pendingCell, size)) setPendingCell(null)
  }

  const gridCells = Array.from({ length: gridRows * gridColumns }, (_, index) => {
    const row = Math.floor(index / gridColumns)
    const column = index % gridColumns

    return (
      <GridCell
        key={`${row}-${column}`}
        row={row}
        column={column}
        isOccupied={isCellOccupied({ row, column })}
        disabled={!canAddStickyNote}
        onAdd={() => setPendingCell({ row, column })}
      />
    )
  })

  return (
    <main
      className="relative min-h-dvh bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${liegeImage})` }}
    >
      <div
        data-dashboard-grid
        className="grid h-dvh w-full grid-cols-5 grid-rows-4"
      >
        {gridCells}
        {stickyNotes.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            isDeleting={deletingStickyNoteId === note.id}
            onDelete={() => deleteStickyNote(note.id)}
          />
        ))}
      </div>
      <LogoutButton />
      {dashboardError && (
        <p
          role="alert"
          className="fixed bottom-4 left-4 z-40 max-w-[calc(100%-2rem)] rounded-md bg-white/95 px-4 py-3 text-sm text-red-800 shadow-lg"
        >
          {dashboardError}
        </p>
      )}
      {pendingCell && (
        <StickyNoteSizeDialog
          canPlace={(size) => canPlaceStickyNote(pendingCell, size)}
          isSaving={isSavingStickyNote}
          onSelect={handleSelectSize}
          onClose={() => setPendingCell(null)}
        />
      )}
    </main>
  )
}

export default Dashboard
