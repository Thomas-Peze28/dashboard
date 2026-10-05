export type GridPosition = {
  row: number
  column: number
}

export type StickyNoteSize = {
  columns: number
  rows: number
}

export type StickyNote = GridPosition & StickyNoteSize & { id: string }
