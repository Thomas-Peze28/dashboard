import { useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import pinImage from '../../assets/pin.png'
import { gridColumns, gridRows } from '../../constants/grid'
import type { GridPosition, StickyNote, StickyNoteContent } from '../../types/stickyNote'
import ClockContent from './clock/ClockContent'
import GithubProfileContent from './github/GithubProfileContent'
import PokemonContent from './pokemon/PokemonContent'
import WeatherContent from './weather/WeatherContent'

type StickyNoteCardProps = {
  note: StickyNote
  isDeleting: boolean
  canMoveTo: (position: GridPosition) => boolean
  onMove: (position: GridPosition) => void
  onEdit: () => void
  onChangeContent: (content: StickyNoteContent) => Promise<boolean>
}

type DragState = {
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  cellWidth: number
  cellHeight: number
}

// En dessous de cette distance (en pixels), le geste compte comme un clic et non un déplacement.
const clickTolerance = 5

function StickyNoteCard({ note, isDeleting, canMoveTo, onMove, onEdit, onChangeContent }: StickyNoteCardProps) {
  const [drag, setDrag] = useState<DragState | null>(null)

  const isMoving = drag !== null && Math.hypot(drag.offsetX, drag.offsetY) >= clickTolerance
  // Case visée par le coin haut-gauche du post-it, bornée à la grille.
  const dropTarget: GridPosition | null =
    drag && isMoving
      ? {
          row: Math.min(
            Math.max(note.row + Math.round(drag.offsetY / drag.cellHeight), 0),
            gridRows - note.rows,
          ),
          column: Math.min(
            Math.max(note.column + Math.round(drag.offsetX / drag.cellWidth), 0),
            gridColumns - note.columns,
          ),
        }
      : null
  const canDrop = dropTarget !== null && canMoveTo(dropTarget)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isDeleting || event.button !== 0) return
    // Les boutons et les liens posés sur le post-it gardent leur propre clic.
    if ((event.target as HTMLElement).closest('button, a')) return

    const grid = event.currentTarget.closest('[data-dashboard-grid]')
    if (!grid) return

    const { width, height } = grid.getBoundingClientRect()

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({
      startX: event.clientX,
      startY: event.clientY,
      offsetX: 0,
      offsetY: 0,
      cellWidth: width / gridColumns,
      cellHeight: height / gridRows,
    })
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return

    setDrag({ ...drag, offsetX: event.clientX - drag.startX, offsetY: event.clientY - drag.startY })
  }

  const handlePointerUp = () => {
    if (!drag) return

    if (!isMoving) onEdit()
    else if (dropTarget && canDrop) onMove(dropTarget)
    setDrag(null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (isDeleting || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    onEdit()
  }

  return (
    <>
      {dropTarget && (
        <div
          aria-hidden="true"
          style={{
            gridColumn: `${dropTarget.column + 1} / span ${note.columns}`,
            gridRow: `${dropTarget.row + 1} / span ${note.rows}`,
          }}
          className={`pointer-events-none z-10 m-1 rounded-md border-2 border-dashed ${
            canDrop ? 'border-white/90 bg-white/25' : 'border-red-500/90 bg-red-500/25'
          }`}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label="Modifier le post-it"
        aria-disabled={isDeleting}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
        style={{
          gridColumn: `${note.column + 1} / span ${note.columns}`,
          gridRow: `${note.row + 1} / span ${note.rows}`,
          aspectRatio: `${note.columns} / ${note.rows}`,
          height: '94%',
          maxWidth: '94%',
          translate: drag ? `${drag.offsetX}px ${drag.offsetY}px` : undefined,
        }}
        className={`group/note relative rotate-[-1.5deg] touch-none select-none self-center justify-self-center rounded-sm bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isDeleting ? 'opacity-60' : ''} ${
          isMoving
            ? 'z-30 cursor-grabbing shadow-[6px_14px_18px_rgba(45,30,10,0.45)]'
            : 'z-10 cursor-pointer hover:z-20 shadow-[2px_5px_8px_rgba(45,30,10,0.38)]'
        }`}
      >
        <img
          src={pinImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute left-1/2 top-0 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
        />
        {note.content.kind === 'clock' ? (
          <ClockContent timezone={note.content.timezone} columns={note.columns} rows={note.rows} />
        ) : note.content.kind === 'pokemonRandom' || note.content.kind === 'pokemonCard' ? (
          // La clé recharge la carte quand la langue ou le nom cherché change, mais pas quand on la met en favori.
          <PokemonContent
            key={`${note.content.language}:${note.content.kind === 'pokemonCard' && !note.content.cardId ? note.content.name : ''}`}
            noteId={note.id}
            content={note.content}
            columns={note.columns}
            rows={note.rows}
            onChangeContent={onChangeContent}
          />
        ) : note.content.kind === 'githubProfile' ? (
          <GithubProfileContent
            noteId={note.id}
            columns={note.columns}
            rows={note.rows}
          />
        ) : (
          // La clé force un rechargement des données quand la ville ou le nombre de jours change.
          <WeatherContent
            key={JSON.stringify(note.content)}
            noteId={note.id}
            content={note.content}
            columns={note.columns}
            rows={note.rows}
          />
        )}
      </div>
    </>
  )
}

export default StickyNoteCard
