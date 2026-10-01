import { useEffect, useState, type FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import liegeImage from './assets/liege.jpg'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type AuthMode = 'login' | 'register'

function App() {
  const isAuthenticated = Boolean(localStorage.getItem('dashboard_token'))
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
    return (
      <main
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${liegeImage})` }}
      >
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
