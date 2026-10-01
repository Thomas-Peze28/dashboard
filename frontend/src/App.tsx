import { useEffect, useState, type FormEvent } from 'react'
import { LogOut, Plus, X } from 'lucide-react'
import liegeImage from './assets/liege.jpg'
import pinImage from './assets/pin.png'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const gridColumns = 5
const gridRows = 4

type StickyNote = {
  row: number
  column: number
  columns: number
  rows: number
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

type AuthMode = 'login' | 'register'

function App() {
  const isAuthenticated = Boolean(localStorage.getItem('dashboard_token'))
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [pendingCell, setPendingCell] = useState<GridPosition | null>(null)
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).has('error')
      ? 'La connexion Google a échoué. Veuillez réessayer.'
      : '',
  )
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const oauthError = params.has('error')

    if (oauthError) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (token && !oauthError) {
      localStorage.setItem('dashboard_token', token)
      const user = params.get('user')

      if (user) {
        try {
          localStorage.setItem('dashboard_user', decodeURIComponent(user))
        } catch {
          localStorage.setItem('dashboard_user', JSON.stringify({ email: 'google-user' }))
        }
      }

      window.location.replace('/dashboard')
      return
    }

    if (isAuthenticated && window.location.pathname !== '/dashboard') {
      window.location.replace('/dashboard')
      return
    }

    if (!isAuthenticated && window.location.pathname === '/dashboard') {
      window.location.replace('/')
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

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Identifiants incorrects.')
      }

      localStorage.setItem('dashboard_token', data.token)
      localStorage.setItem('dashboard_user', JSON.stringify(data.user))
      window.location.assign('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Une erreur est survenue lors de l’inscription.')
      }

      setSuccess('Compte créé avec succès. Vérifiez votre email puis connectez-vous.')
      setMode('login')
      setForm({ name: '', email: '', password: '', confirmPassword: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${apiBaseUrl}/api/auth/google`
  }

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

  const addStickyNote = (size: StickyNoteSize) => {
    if (!pendingCell || !canPlaceStickyNote(size)) return

    setStickyNotes((current) => [...current, { ...pendingCell, ...size }])
    setPendingCell(null)
  }

  const switchToRegister = () => {
    setError('')
    setSuccess('')
    setMode('register')
  }

  const switchToLogin = () => {
    setError('')
    setSuccess('')
    setMode('login')
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
              aria-label={`Ajouter un post-it, rangée ${row + 1}, colonne ${column + 1}`}
              className="group/add flex h-full w-full items-center justify-center"
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
              key={`${note.row}-${note.column}-${note.columns}-${note.rows}`}
              style={{
                gridColumn: `${note.column + 1} / span ${note.columns}`,
                gridRow: `${note.row + 1} / span ${note.rows}`,
                aspectRatio: `${note.columns} / ${note.rows}`,
                height: '94%',
                maxWidth: '94%',
              }}
              className="relative z-10 rotate-[-1.5deg] self-center justify-self-center rounded-sm bg-yellow-300 shadow-[2px_5px_8px_rgba(45,30,10,0.38)]"
            >
              <img
                src={pinImage}
                alt=""
                aria-hidden="true"
                className="absolute left-1/2 top-0 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
              />
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
            deconnexion
          </span>
        </button>
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
                      disabled={!isAvailable}
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
                        {isAvailable ? 'cases' : 'indisponible ici'}
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

  return (
    <main className="login-shell">
      <section className="glass-panel login-layout">
        <div className="login-card">
          <div className="card-header">
            <span className="badge">{mode === 'login' ? 'Connexion' : 'Inscription'}</span>
            <h2>{mode === 'login' ? 'Accédez à votre compte' : 'Créez votre compte'}</h2>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className="input-field"
                  required
                />
              </label>

              <label>
                <span>Mot de passe</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-field"
                  required
                />
              </label>

              <div className="form-row">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <a href="#">Mot de passe oublié ?</a>
              </div>

              {error && (
                <p className="message error" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className="message success" role="status">
                  {success}
                </p>
              )}

              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="login-form">
              <label>
                <span>Nom complet</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="Votre nom"
                  autoComplete="name"
                  className="input-field"
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className="input-field"
                  required
                />
              </label>

              <label>
                <span>Mot de passe</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  className="input-field"
                  required
                />
              </label>

              <label>
                <span>Confirmer le mot de passe</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={(event) => handleChange('confirmPassword', event.target.value)}
                  placeholder="Répétez votre mot de passe"
                  autoComplete="new-password"
                  className="input-field"
                  required
                />
              </label>

              {error && (
                <p className="message error" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className="message success" role="status">
                  {success}
                </p>
              )}

              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
          )}

          <div className="divider">
            <span>ou</span>
          </div>

          <div className="social-actions single-action">
            <button type="button" className="social-button" onClick={handleGoogleLogin}>
              Continuer avec Google
            </button>
          </div>

          <p className="register-link">
            {mode === 'login' ? (
              <>
                Vous n&apos;avez pas de compte ?{' '}
                <button type="button" className="text-link-button" onClick={switchToRegister}>
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Vous avez déjà un compte ?{' '}
                <button type="button" className="text-link-button" onClick={switchToLogin}>
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
