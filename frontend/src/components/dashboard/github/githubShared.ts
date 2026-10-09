import { apiBaseUrl } from '../../../api/client'
import { fetchStickyNoteData } from '../../../api/stickyNotes'

export const githubRefreshDelay = 10 * 60 * 1000

// Messages d'erreur du backend pour les widgets GitHub, traduits pour le post-it.
const errorLabels: Record<string, string> = {
  'No GitHub account linked. Please sign in with GitHub.': 'Connectez-vous avec GitHub pour utiliser ce widget',
  'GitHub token expired or revoked. Please sign in with GitHub again.': 'Reconnectez-vous avec GitHub',
  'Missing GitHub permissions. Please sign in with GitHub again.': 'Reconnectez-vous avec GitHub',
  'GitHub rate limit reached. Please try again later.': 'Limite GitHub atteinte, réessayez plus tard',
  'Invalid widget configuration.': 'Configuration invalide',
}

// Erreurs qui se règlent en (re)passant par la connexion GitHub.
const loginRequiredErrors = [
  'No GitHub account linked. Please sign in with GitHub.',
  'GitHub token expired or revoked. Please sign in with GitHub again.',
  'Missing GitHub permissions. Please sign in with GitHub again.',
]

export const isGithubLoginRequired = (error: string | null) => error !== null && loginRequiredErrors.includes(error)

// Au retour de GitHub, le backend relie le compte et renvoie vers le dashboard.
export const redirectToGithubLogin = () => {
  window.location.href = `${apiBaseUrl}/api/auth/github`
}

// Vrai si le widget GitHub de ce post-it ne peut pas charger ses données sans connexion GitHub.
export async function needsGithubLogin(noteId: string) {
  try {
    await fetchStickyNoteData(noteId)
    return false
  } catch (error) {
    return isGithubLoginRequired(error instanceof Error ? error.message : null)
  }
}

export const describeGithubError = (error: string, notFoundLabel: string) =>
  error === 'GitHub resource not found.' ? notFoundLabel : (errorLabels[error] ?? 'GitHub indisponible')

const countFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

export const formatCount = (count: number) => countFormat.format(count)
