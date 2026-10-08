export type GridPosition = {
  row: number
  column: number
}

export type StickyNoteSize = {
  columns: number
  rows: number
}

export type StickyNoteContent = { kind: 'empty' } | { kind: 'clock'; timezone: string }

export type StickyNoteContentKind = StickyNoteContent['kind']

export type StickyNote = GridPosition & StickyNoteSize & { id: string; content: StickyNoteContent }
