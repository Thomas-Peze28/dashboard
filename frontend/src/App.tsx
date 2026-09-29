import { useState, type FormEvent } from 'react'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function App() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      setSuccess('Connexion réussie. Redirection en cours...')
      setForm({ email: '', password: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="glass-panel login-layout">
        <div className="login-card">
          <div className="card-header">
            <span className="badge">Connexion</span>
            <h2>Accédez à votre compte</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
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
                onChange={(event) => setForm({ ...form, password: event.target.value })}
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

          <div className="divider">
            <span>ou</span>
          </div>

          <div className="social-actions">
            <button type="button" className="social-button">
              Google
            </button>
            <button type="button" className="social-button">
              Github
            </button>
          </div>

          <p className="register-link">
            Vous n&apos;avez pas de compte ? <a href="#">Créer un compte</a>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
