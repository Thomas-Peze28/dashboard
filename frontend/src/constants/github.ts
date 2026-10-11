// Même règle que le backend : 1 à 39 caractères, lettres, chiffres et tirets, sans tiret au début.
export const githubUsernamePattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/

export const minGithubNotificationsLimit = 1
export const maxGithubNotificationsLimit = 50
export const defaultGithubNotificationsLimit = 50

export const clampGithubNotificationsLimit = (limit: number) =>
  Math.min(Math.max(limit, minGithubNotificationsLimit), maxGithubNotificationsLimit)
