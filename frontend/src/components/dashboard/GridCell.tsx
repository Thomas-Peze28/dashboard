import { Plus } from 'lucide-react'

type GridCellProps = {
  row: number
  column: number
  isOccupied: boolean
  disabled: boolean
  onAdd: () => void
}

function GridCell({ row, column, isOccupied, disabled, onAdd }: GridCellProps) {
  return (
    <div
      style={{ gridColumn: column + 1, gridRow: row + 1 }}
      className="flex min-h-0 min-w-0 items-center justify-center"
    >
      {!isOccupied && (
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          aria-label={`Ajouter un post-it, rangée ${row + 1}, colonne ${column + 1}`}
          className="group/add flex h-full w-full items-center justify-center disabled:cursor-wait"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white/90 opacity-65 shadow-sm transition hover:scale-110 hover:bg-black/55 hover:opacity-100 group-hover/add:opacity-100 group-focus-visible/add:opacity-100">
            <Plus size={16} aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  )
}

export default GridCell
