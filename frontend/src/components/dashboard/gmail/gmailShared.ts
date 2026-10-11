export const gmailInboxUrl = 'https://mail.google.com/mail/u/0/#inbox'

export const describeGmailError = (error: string) =>
  error === 'Google rate limit reached. Please try again later.'
    ? 'Limite Google atteinte, réessayez plus tard'
    : 'Gmail indisponible'
