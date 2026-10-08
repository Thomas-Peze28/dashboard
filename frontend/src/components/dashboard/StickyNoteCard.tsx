import { Trash2 } from 'lucide-react'
import pinImage from '../../assets/pin.png'
import type { StickyNote } from '../../types/stickyNote'
import ClockContent from './clock/ClockContent'

type StickyNoteCardProps = {
  note: StickyNote
  isDeleting: boolean
  onDelete: () => void
}

function StickyNoteCard({ note, isDeleting, onDelete }: StickyNoteCardProps) {
  return (
    <div
      style={{
        gridColumn: `${note.column + 1} / span ${note.columns}`,
        gridRow: `${note.row + 1} / span ${note.rows}`,
        aspectRatio: `${note.columns} / ${note.rows}`,
        height: '94%',
        maxWidth: '94%',
      }}
      className="group/note relative z-10 rotate-[-1.5deg] self-center justify-self-center rounded-sm bg-yellow-300 shadow-[2px_5px_8px_rgba(45,30,10,0.38)]"
    >
      <img
        src={pinImage}
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-0 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
      />
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label="Supprimer le post-it"
        title="Supprimer le post-it"
        className="absolute right-1 top-1 z-20 inline-flex h-7 w-7 items-center justify-center rounded-sm bg-white/85 text-red-700 shadow-sm transition hover:bg-red-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
      {note.content.kind === 'clock' && (
        <ClockContent timezone={note.content.timezone} columns={note.columns} rows={note.rows} />
      )}
    </div>
  )
}

export default StickyNoteCard
