import { useEffect, useState } from 'react'
import { LogOut, Plus, Trash2, X } from 'lucide-react'
import liegeImage from './assets/liege.jpg'
import pinImage from './assets/pin.png'
import LoginPage from './components/LoginPage'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const gridColumns = 5
const gridRows = 4

type StickyNote = {
  id: string
  row: number
  column: number
  columns: number
  rows: number
}

type ServiceCatalogResponse = {
  services: Array<{ widgets: Array<{ id: string; name: string }> }>
}

type UserWidgetsResponse = {
  widgets: Array<{
    id: string
    positionX: number
    positionY: number
    width: number
    height: number
    widget: { name: string }
  }>
}

type GridPosition = {
  row: number
  column: number
}

type StickyNoteSize = {
  columns: number
  rows: number
}

const stickyNoteSizes: StickyNoteSize[] = [
  { columns: 1, rows: 1 },
  { columns: 2, rows: 2 },
  { columns: 3, rows: 2 },
]

function App() {
  const isAuthenticated = Boolean(localStorage.getItem('dashboard_token'))
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [stickyNoteWidgetId, setStickyNoteWidgetId] = useState<string | null>(null)
  const [pendingCell, setPendingCell] = useState<GridPosition | null>(null)
  const [isLoadingStickyNotes, setIsLoadingStickyNotes] = useState(true)
  const [isSavingStickyNote, setIsSavingStickyNote] = useState(false)
  const [deletingStickyNoteId, setDeletingStickyNoteId] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    if (isAuthenticated && window.location.pathname !== '/dashboard') {
      window.location.replace('/dashboard')
      return
    }

    if (!isAuthenticated && window.location.pathname === '/dashboard') {
      window.location.replace('/')
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || window.location.pathname !== '/dashboard') return

    let isCancelled = false
    const loadStickyNotes = async () => {
      try {
        const token = localStorage.getItem('dashboard_token')
        if (!token) throw new Error('Session introuvable.')

        const headers = { Authorization: `Bearer ${token}` }
        const [servicesResponse, widgetsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/services`, { headers }),
          fetch(`${apiBaseUrl}/api/widgets`, { headers }),
        ])

        if (!servicesResponse.ok || !widgetsResponse.ok) {
          throw new Error('Impossible de charger les post-it.')
        }

        const servicesData = (await servicesResponse.json()) as ServiceCatalogResponse
        const widgetsData = (await widgetsResponse.json()) as UserWidgetsResponse
        const noteDefinition = servicesData.services
          .flatMap((service) => service.widgets)
          .find((widget) => widget.name === 'sticky_note')

        if (!noteDefinition) {
          throw new Error('Le catalogue sticky_note est absent. Lancez make db-seed.')
        }

        if (isCancelled) return

        setStickyNoteWidgetId(noteDefinition.id)
        setStickyNotes(
          widgetsData.widgets
            .filter((widget) => widget.widget.name === 'sticky_note')
            .map((widget) => ({
              id: widget.id,
              row: widget.positionY,
              column: widget.positionX,
              columns: widget.width,
              rows: widget.height,
            })),
        )
      } catch (error) {
        if (!isCancelled) {
          setDashboardError(error instanceof Error ? error.message : 'Impossible de charger les post-it.')
        }
      } finally {
        if (!isCancelled) setIsLoadingStickyNotes(false)
      }
    }

    void loadStickyNotes()
    return () => {
      isCancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!pendingCell) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPendingCell(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingCell])

  const handleLogout = () => {
    localStorage.removeItem('dashboard_token')
    localStorage.removeItem('dashboard_user')
    window.location.replace('/')
  }

  const canPlaceStickyNote = (size: StickyNoteSize) => {
    if (!pendingCell) return false
    if (pendingCell.column + size.columns > gridColumns) return false
    if (pendingCell.row + size.rows > gridRows) return false

    return stickyNotes.every(
      (note) =>
        pendingCell.row >= note.row + note.rows ||
        note.row >= pendingCell.row + size.rows ||
        pendingCell.column >= note.column + note.columns ||
        note.column >= pendingCell.column + size.columns,
    )
  }

  const addStickyNote = async (size: StickyNoteSize) => {
    if (!pendingCell || !stickyNoteWidgetId || !canPlaceStickyNote(size)) return

    setIsSavingStickyNote(true)
    setDashboardError('')

    try {
      const token = localStorage.getItem('dashboard_token')
      const response = await fetch(`${apiBaseUrl}/api/widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          widgetId: stickyNoteWidgetId,
          config: {},
          positionX: pendingCell.column,
          positionY: pendingCell.row,
          width: size.columns,
          height: size.rows,
        }),
      })
      const data = (await response.json()) as { widget?: { id: string }; error?: string }

      if (!response.ok || !data.widget) {
        throw new Error(data.error ?? 'Impossible d’enregistrer le post-it.')
      }

      const createdWidget = data.widget
      setStickyNotes((current) => [...current, { id: createdWidget.id, ...pendingCell, ...size }])
      setPendingCell(null)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Impossible d’enregistrer le post-it.')
    } finally {
      setIsSavingStickyNote(false)
    }
  }

  const deleteStickyNote = async (noteId: string) => {
    setDeletingStickyNoteId(noteId)
    setDashboardError('')

    try {
      const token = localStorage.getItem('dashboard_token')
      if (!token) throw new Error('Session introuvable.')

      const response = await fetch(`${apiBaseUrl}/api/widgets/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Impossible de supprimer le post-it.')
      }

      setStickyNotes((current) => current.filter((note) => note.id !== noteId))
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Impossible de supprimer le post-it.')
    } finally {
      setDeletingStickyNoteId(null)
    }
  }

  if (isAuthenticated && window.location.pathname === '/dashboard') {
    const gridCells = Array.from({ length: gridRows * gridColumns }, (_, index) => {
      const row = Math.floor(index / gridColumns)
      const column = index % gridColumns
      const isOccupied = stickyNotes.some(
        (note) =>
          row >= note.row &&
          row < note.row + note.rows &&
          column >= note.column &&
          column < note.column + note.columns,
      )

      return (
        <div
          key={`${row}-${column}`}
          style={{ gridColumn: column + 1, gridRow: row + 1 }}
          className="flex min-h-0 min-w-0 items-center justify-center"
        >
          {!isOccupied && (
            <button
              type="button"
              onClick={() => setPendingCell({ row, column })}
              disabled={isLoadingStickyNotes || !stickyNoteWidgetId}
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
            <div
              key={note.id}
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
                onClick={() => deleteStickyNote(note.id)}
                disabled={deletingStickyNoteId === note.id}
                aria-label="Supprimer le post-it"
                title="Supprimer le post-it"
                className="absolute right-1 top-1 z-20 inline-flex h-7 w-7 items-center justify-center rounded-sm bg-white/85 text-red-700 shadow-sm transition hover:bg-red-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Déconnexion"
          className="group fixed right-6 top-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-red-600 text-white shadow-md transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <LogOut size={20} aria-hidden="true" />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Déconnexion
          </span>
        </button>
        {dashboardError && (
          <p
            role="alert"
            className="fixed bottom-4 left-4 z-40 max-w-[calc(100%-2rem)] rounded-md bg-white/95 px-4 py-3 text-sm text-red-800 shadow-lg"
          >
            {dashboardError}
          </p>
        )}
        {pendingCell && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
            onClick={() => setPendingCell(null)}
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
                  onClick={() => setPendingCell(null)}
                  aria-label="Fermer"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </header>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {stickyNoteSizes.map((size) => {
                  const isAvailable = canPlaceStickyNote(size)

                  return (
                    <button
                      key={`${size.columns}-${size.rows}`}
                      type="button"
                      disabled={!isAvailable || isSavingStickyNote}
                      autoFocus={isAvailable && size.columns === 1 && size.rows === 1}
                      onClick={() => addStickyNote(size)}
                      aria-label={`${size.columns} par ${size.rows} cases${isAvailable ? '' : ', indisponible'}`}
                      className="flex min-w-0 flex-col items-center gap-2 rounded-md border border-gray-200 p-2 text-gray-800 transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white sm:p-3"
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
                        {!isAvailable ? 'indisponible ici' : isSavingStickyNote ? 'enregistrement...' : 'cases'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    )
  }

  return <LoginPage />
}

export default App
