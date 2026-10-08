import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, StickyNote as StickyNoteIcon, X } from 'lucide-react'
import { localTimezone } from '../../constants/timezones'
import type { StickyNoteContent, StickyNoteContentKind } from '../../types/stickyNote'
import TimezonePicker from './clock/TimezonePicker'

type StickyNoteContentDialogProps = {
  initialContent?: StickyNoteContent
  backLabel: string
  submitLabel: string
  isSaving: boolean
  onSelect: (content: StickyNoteContent) => void
  onBack: () => void
  onClose: () => void
}

const contentChoices: Array<{ kind: StickyNoteContentKind; label: string; icon: typeof Clock }> = [
  { kind: 'empty', label: 'Vide', icon: StickyNoteIcon },
  { kind: 'clock', label: 'Horloge', icon: Clock },
]

function StickyNoteContentDialog({
  initialContent,
  backLabel,
  submitLabel,
  isSaving,
  onSelect,
  onBack,
  onClose,
}: StickyNoteContentDialogProps) {
  const [kind, setKind] = useState<StickyNoteContentKind>(initialContent?.kind ?? 'empty')
  const [timezone, setTimezone] = useState(
    initialContent?.kind === 'clock' ? initialContent.timezone : localTimezone,
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = () => {
    onSelect(kind === 'clock' ? { kind, timezone } : { kind })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sticky-note-content-dialog-title"
        aria-describedby="sticky-note-content-dialog-description"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="sticky-note-content-dialog-title" className="text-lg font-semibold text-gray-900">
              Choisir le contenu du post-it
            </h2>
            <p id="sticky-note-content-dialog-description" className="mt-1 text-sm text-gray-600">
              Le widget sera affiché sur le post-it.
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

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {contentChoices.map((choice) => {
            const Icon = choice.icon
            const isSelected = choice.kind === kind

            return (
              <button
                key={choice.kind}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setKind(choice.kind)}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-md border p-3 text-gray-800 transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 ${
                  isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <Icon size={28} aria-hidden="true" />
                <span className="text-sm font-semibold">{choice.label}</span>
              </button>
            )
          })}
        </div>

        {kind === 'clock' && <TimezonePicker value={timezone} onChange={setTimezone} />}

        <footer className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 disabled:opacity-60"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? 'Enregistrement...' : submitLabel}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default StickyNoteContentDialog
