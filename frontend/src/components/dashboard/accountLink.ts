import { apiBaseUrl } from '../../api/client'
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

export const redirectToLogin = (provider: AccountProvider) => {
  window.location.href = `${apiBaseUrl}/api/auth/${provider}`
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
