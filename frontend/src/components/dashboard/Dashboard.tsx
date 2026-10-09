import { useState } from 'react'
import liegeImage from '../../assets/liege.jpg'
import { gridColumns, gridRows } from '../../constants/grid'
import { useStickyNotes } from '../../hooks/useStickyNotes'
import type { GridPosition, StickyNoteContent, StickyNoteSize } from '../../types/stickyNote'
import { needsGithubLogin, redirectToGithubLogin } from './github/githubShared'
import GridCell from './GridCell'
import LogoutButton from './LogoutButton'
import StickyNoteCard from './StickyNoteCard'
import StickyNoteContentDialog from './StickyNoteContentDialog'
import StickyNoteEditDialog from './StickyNoteEditDialog'
import StickyNoteSizeDialog from './StickyNoteSizeDialog'

type EditState = { noteId: string; step: 'menu' | 'size' | 'content' }

function Dashboard() {
  const [pendingCell, setPendingCell] = useState<GridPosition | null>(null)
  const [pendingSize, setPendingSize] = useState<StickyNoteSize | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const {
    stickyNotes,
    canAddStickyNote,
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
  } = useStickyNotes()

  const closeDialog = () => {
    setPendingCell(null)
    setPendingSize(null)
  }

  // Un widget GitHub sans compte relié envoie directement vers la connexion GitHub.
  const connectGithubIfNeeded = async (noteId: string, content: StickyNoteContent) => {
    if (content.kind === 'githubProfile' && (await needsGithubLogin(noteId))) redirectToGithubLogin()
  }

  const handleSelectContent = async (content: StickyNoteContent) => {
    if (!pendingCell || !pendingSize) return
    const createdNote = await addStickyNote(pendingCell, pendingSize, content)

    if (!createdNote) return

    closeDialog()
    await connectGithubIfNeeded(createdNote.id, content)
  }

  const editedNote = editState ? stickyNotes.find((note) => note.id === editState.noteId) : undefined
  const closeEdit = () => setEditState(null)
  const backToEditMenu = () => setEditState((current) => current && { ...current, step: 'menu' })

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
        className="grid h-dvh w-full"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {gridCells}
        {stickyNotes.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            isDeleting={deletingStickyNoteId === note.id}
            canMoveTo={(position) => canPlaceStickyNote(position, note, note.id)}
            onMove={(position) => relocateStickyNote(note.id, position)}
            onEdit={() => setEditState({ noteId: note.id, step: 'menu' })}
            onChangeContent={(content) => changeStickyNoteWidget(note.id, content)}
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
      {pendingCell && !pendingSize && (
        <StickyNoteSizeDialog
          canPlace={(size) => canPlaceStickyNote(pendingCell, size)}
          onSelect={setPendingSize}
          onClose={closeDialog}
        />
      )}
      {pendingCell && pendingSize && (
        <StickyNoteContentDialog
          size={pendingSize}
          backLabel="Taille"
          submitLabel="Ajouter"
          isSaving={isSavingStickyNote}
          onSelect={handleSelectContent}
          onBack={() => setPendingSize(null)}
          onClose={closeDialog}
        />
      )}
      {editedNote && editState?.step === 'menu' && (
        <StickyNoteEditDialog
          onResize={() => setEditState({ noteId: editedNote.id, step: 'size' })}
          onChangeContent={() => setEditState({ noteId: editedNote.id, step: 'content' })}
          onDelete={() => {
            closeEdit()
            void deleteStickyNote(editedNote.id)
          }}
          onClose={closeEdit}
        />
      )}
      {editedNote && editState?.step === 'size' && (
        <StickyNoteSizeDialog
          currentSize={editedNote}
          isSaving={isSavingStickyNote}
          canPlace={(size) => canPlaceStickyNote(editedNote, size, editedNote.id)}
          onSelect={async (size) => {
            if (await changeStickyNoteSize(editedNote.id, size)) closeEdit()
          }}
          onBack={backToEditMenu}
          onClose={closeEdit}
        />
      )}
      {editedNote && editState?.step === 'content' && (
        <StickyNoteContentDialog
          size={editedNote}
          initialContent={editedNote.content}
          backLabel="Retour"
          submitLabel="Enregistrer"
          isSaving={isSavingStickyNote}
          onSelect={async (content) => {
            if (!(await changeStickyNoteWidget(editedNote.id, content))) return

            closeEdit()
            await connectGithubIfNeeded(editedNote.id, content)
          }}
          onBack={backToEditMenu}
          onClose={closeEdit}
        />
      )}
    </main>
  )
}

export default Dashboard
