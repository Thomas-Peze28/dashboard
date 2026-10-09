export const githubRefreshDelay = 10 * 60 * 1000

const errorLabels: Record<string, string> = {
  'No GitHub account linked. Please sign in with GitHub.': 'Connectez-vous avec GitHub pour utiliser ce widget',
  'GitHub token expired or revoked. Please sign in with GitHub again.': 'Reconnectez-vous avec GitHub',
  'Missing GitHub permissions. Please sign in with GitHub again.': 'Reconnectez-vous avec GitHub',
  'GitHub rate limit reached. Please try again later.': 'Limite GitHub atteinte, réessayez plus tard',
  'Invalid widget configuration.': 'Configuration invalide',
}

export const describeGithubError = (error: string, notFoundLabel: string) =>
  error === 'GitHub resource not found.' ? notFoundLabel : (errorLabels[error] ?? 'GitHub indisponible')

const countFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

export const formatCount = (count: number) => countFormat.format(count)
