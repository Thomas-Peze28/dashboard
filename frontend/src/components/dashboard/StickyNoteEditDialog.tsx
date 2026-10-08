import { useEffect } from 'react'
import { LayoutGrid, Scaling, Trash2, X } from 'lucide-react'

type StickyNoteEditDialogProps = {
  onResize: () => void
  onChangeContent: () => void
  onDelete: () => void
  onClose: () => void
}

const actionClass =
  'flex min-w-0 flex-col items-center gap-2 rounded-md border border-gray-200 p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2'

function StickyNoteEditDialog({ onResize, onChangeContent, onDelete, onClose }: StickyNoteEditDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sticky-note-edit-dialog-title"
        aria-describedby="sticky-note-edit-dialog-description"
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="sticky-note-edit-dialog-title" className="text-lg font-semibold text-gray-900">
              Modifier le post-it
            </h2>
            <p id="sticky-note-edit-dialog-description" className="mt-1 text-sm text-gray-600">
              Changez sa taille, son widget, ou supprimez-le.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            type="button"
            autoFocus
            onClick={onResize}
            className={`${actionClass} text-gray-800 hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-yellow-600`}
          >
            <Scaling size={28} aria-hidden="true" />
            <span className="text-sm font-semibold">Changer la taille</span>
          </button>
          <button
            type="button"
            onClick={onChangeContent}
            className={`${actionClass} text-gray-800 hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-yellow-600`}
          >
            <LayoutGrid size={28} aria-hidden="true" />
            <span className="text-sm font-semibold">Changer de widget</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${actionClass} text-red-700 hover:border-red-600 hover:bg-red-50 focus-visible:outline-red-700`}
          >
            <Trash2 size={28} aria-hidden="true" />
            <span className="text-sm font-semibold">Supprimer</span>
          </button>
        </div>
      </section>
    </div>
  )
}

export default StickyNoteEditDialog
