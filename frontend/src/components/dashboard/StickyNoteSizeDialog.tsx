import { useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import pinImage from '../../assets/pin.png'
import { stickyNoteSizes } from '../../constants/grid'
import type { StickyNoteSize } from '../../types/stickyNote'

type StickyNoteSizeDialogProps = {
  currentSize?: StickyNoteSize
  isSaving?: boolean
  onBack?: () => void
  canPlace: (size: StickyNoteSize) => boolean
  onSelect: (size: StickyNoteSize) => void
  onClose: () => void
}

function StickyNoteSizeDialog({
  currentSize,
  isSaving = false,
  onBack,
  canPlace,
  onSelect,
  onClose,
}: StickyNoteSizeDialogProps) {
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
        aria-labelledby="sticky-note-dialog-title"
        aria-describedby="sticky-note-dialog-description"
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="sticky-note-dialog-title" className="text-lg font-semibold text-gray-900">
              Choisir la taille du post-it
            </h2>
            <p id="sticky-note-dialog-description" className="mt-1 text-sm text-gray-600">
              Le post-it occupera plusieurs cases de la grille.
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
          {stickyNoteSizes.map((size) => {
            const isAvailable = canPlace(size)
            const isCurrent = size.columns === currentSize?.columns && size.rows === currentSize?.rows

            return (
              <button
                key={`${size.columns}-${size.rows}`}
                type="button"
                disabled={!isAvailable || isSaving}
                aria-pressed={currentSize ? isCurrent : undefined}
                autoFocus={isAvailable && size.columns === 1 && size.rows === 1}
                onClick={() => onSelect(size)}
                aria-label={`${size.columns} par ${size.rows} cases${isAvailable ? '' : ', indisponible'}`}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-md border p-2 text-gray-800 transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white sm:p-3 ${
                  isCurrent ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <span
                  className="relative grid h-14 w-14 gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${size.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${size.rows}, minmax(0, 1fr))`,
                  }}
                  aria-hidden="true"
                >
                  {Array.from({ length: size.columns * size.rows }, (_, index) => (
                    <span key={index} className="rounded-[1px] bg-yellow-300 shadow-sm" />
                  ))}
                  <img
                    src={pinImage}
                    alt=""
                    className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 object-contain"
                  />
                </span>
                <span className="text-sm font-semibold">
                  {size.columns} × {size.rows}
                </span>
                <span className="text-xs text-gray-500">
                  {isCurrent ? 'taille actuelle' : isAvailable ? 'cases' : 'indisponible ici'}
                </span>
              </button>
            )
          })}
        </div>

        {onBack && (
          <footer className="mt-6 flex">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 disabled:opacity-60"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Retour
            </button>
          </footer>
        )}
      </section>
    </div>
  )
}

export default StickyNoteSizeDialog
