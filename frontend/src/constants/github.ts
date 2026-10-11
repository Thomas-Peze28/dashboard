export const minGithubNotificationsLimit = 1
export const maxGithubNotificationsLimit = 50
export const defaultGithubNotificationsLimit = 50

export const clampGithubNotificationsLimit = (limit: number) =>
  Math.min(Math.max(limit, minGithubNotificationsLimit), maxGithubNotificationsLimit)
