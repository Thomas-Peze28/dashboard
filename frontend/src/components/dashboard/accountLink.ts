import { apiBaseUrl, authHeaders } from '../../api/client'
import { fetchStickyNoteData } from '../../api/stickyNotes'
import type { StickyNoteContent } from '../../types/stickyNote'

export type AccountProvider = 'github' | 'google'

const providerNames: Record<AccountProvider, string> = { github: 'GitHub', google: 'Google' }

export const loginLabels: Record<AccountProvider, string> = {
  github: 'Se connecter avec GitHub',
  google: 'Se connecter avec Google',
}

export const isLoginRequired = (provider: AccountProvider, error: string | null) => {
  const name = providerNames[provider]

  return (
    error === `No ${name} account linked. Please sign in with ${name}.` ||
    error === `${name} token expired or revoked. Please sign in with ${name} again.` ||
    error === `Missing ${name} permissions. Please sign in with ${name} again.`
  )
}

// Relie le compte GitHub / Google à l'utilisateur connecté : le backend renvoie l'adresse d'autorisation,
// qui permet de rattacher le compte même si son e-mail est différent. Sans session, simple connexion.
export const redirectToLogin = (provider: AccountProvider) => {
  void (async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/${provider}/link`, { method: 'POST', headers: authHeaders() })
      const data = (await response.json()) as { url?: string }

      if (response.ok && data.url) {
        window.location.href = data.url
        return
      }
    } catch {
      // Pas de session valide : on passe par la connexion classique ci-dessous.
    }
    window.location.href = `${apiBaseUrl}/api/auth/${provider}`
  })()
}

// Messages affichés au retour d'une liaison qui a échoué (paramètre ?error= de l'adresse).
export const linkErrorMessages: Record<string, string> = {
  account_already_linked: 'Ce compte est déjà relié à un autre utilisateur du Dashboard.',
  oauth_failed: 'La liaison du compte a échoué. Veuillez réessayer.',
}

export const getAccountProvider = (content: StickyNoteContent): AccountProvider | null => {
  if (content.kind.startsWith('github')) return 'github'
  if (content.kind.startsWith('gmail')) return 'google'
  return null
}

export async function needsLogin(provider: AccountProvider, noteId: string) {
  try {
    await fetchStickyNoteData(noteId)
    return false
  } catch (error) {
    return isLoginRequired(provider, error instanceof Error ? error.message : null)
  }
}
