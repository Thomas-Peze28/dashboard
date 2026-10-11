type PopularTimezone = { timezone: string; label: string; keywords?: string }

const popularTimezones: PopularTimezone[] = [
  { timezone: 'Europe/Paris', label: 'Paris', keywords: 'france' },
  { timezone: 'Europe/London', label: 'Londres', keywords: 'london royaume-uni angleterre uk' },
  { timezone: 'America/New_York', label: 'New York', keywords: 'usa etats-unis us' },
  { timezone: 'America/Chicago', label: 'Chicago', keywords: 'usa etats-unis us' },
  { timezone: 'America/Los_Angeles', label: 'Los Angeles', keywords: 'usa etats-unis us californie' },
  { timezone: 'America/Sao_Paulo', label: 'São Paulo', keywords: 'bresil' },
  { timezone: 'Africa/Dakar', label: 'Dakar', keywords: 'senegal' },
  { timezone: 'Asia/Dubai', label: 'Dubaï', keywords: 'emirats' },
  { timezone: 'Asia/Kolkata', label: 'New Delhi', keywords: 'inde india' },
  { timezone: 'Asia/Shanghai', label: 'Shanghai', keywords: 'chine china pekin' },
  { timezone: 'Asia/Tokyo', label: 'Tokyo', keywords: 'japon japan' },
  { timezone: 'Australia/Sydney', label: 'Sydney', keywords: 'australie' },
]

export const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

export function isValidTimezone(timezone: unknown): timezone is string {
  if (typeof timezone !== 'string') return false

  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

export function getTimezoneLabel(timezone: string) {
  const popular = popularTimezones.find((item) => item.timezone === timezone)
  if (popular) return popular.label

  return (timezone.split('/').pop() ?? timezone).replaceAll('_', ' ')
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .trim()
}

export type TimezoneOption = { timezone: string; label: string; search: string; isPopular: boolean }

const toOption = (timezone: string, isPopular: boolean, keywords = ''): TimezoneOption => ({
  timezone,
  isPopular,
  label: getTimezoneLabel(timezone),
  search: normalizeSearch(`${getTimezoneLabel(timezone)} ${timezone} ${keywords}`),
})

export const timezoneOptions: TimezoneOption[] = [
  ...popularTimezones.map((item) => toOption(item.timezone, true, item.keywords)),
  ...Intl.supportedValuesOf('timeZone')
    .filter((timezone) => popularTimezones.every((item) => item.timezone !== timezone))
    .map((timezone) => toOption(timezone, false)),
]
