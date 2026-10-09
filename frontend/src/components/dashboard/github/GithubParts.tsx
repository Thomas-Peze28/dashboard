import type { Link } from 'lucide-react'
import { formatCount } from './githubShared'

type GithubIcon = typeof Link

export type GithubStat = { icon: GithubIcon; label: string; value: number }

export type GithubDetail = { icon: GithubIcon; label: string; value: string | null; href?: string }

export function GithubStats({ stats, className }: { stats: GithubStat[]; className: string }) {
  return (
    <dl className={`flex w-full gap-[0.5em] text-center leading-none ${className}`}>
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex min-w-0 flex-1 flex-col items-center gap-[0.25em] rounded-md bg-white/55 px-[0.2em] py-[0.45em] shadow-sm"
        >
          <Icon aria-hidden="true" className="h-[0.9em] w-[0.9em] text-gray-700" />
          <dt className="order-last max-w-full truncate text-[0.55em] text-gray-700">{label}</dt>
          <dd className="font-bold tabular-nums">{formatCount(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function GithubDetails({ details, className }: { details: GithubDetail[]; className: string }) {
  const visibleDetails = details.filter((detail) => detail.value)

  if (visibleDetails.length === 0) return null

  return (
    <ul className={`min-w-0 leading-none text-gray-800 ${className}`}>
      {visibleDetails.map(({ icon: Icon, label, value, href }) => (
        <li key={label} title={label} className="flex min-w-0 items-center gap-[0.6em]">
          <span className="flex h-[1.9em] w-[1.9em] shrink-0 items-center justify-center rounded-full bg-white/55 shadow-sm">
            <Icon aria-hidden="true" className="h-[1.05em] w-[1.05em]" />
          </span>
          <span className="sr-only">{label} :</span>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-semibold underline underline-offset-2 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              {value}
            </a>
          ) : (
            <span className="truncate">{value}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function GithubPlaceholder({
  title,
  message,
  isError = false,
  onLogin,
}: {
  title: string
  message: string
  isError?: boolean
  onLogin?: () => void
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqmin] overflow-hidden p-[7cqmin] text-center text-gray-900 [container-type:size]">
      <span
        className={`max-w-full truncate font-semibold leading-none text-gray-700 ${
          isError ? 'text-[8cqmin]' : 'text-[10cqmin]'
        }`}
      >
        {title}
      </span>
      {onLogin ? (
        <button
          type="button"
          onClick={onLogin}
          className="rounded-sm bg-gray-900 px-[4cqmin] py-[2.5cqmin] text-[7cqmin] font-semibold leading-tight text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Se connecter avec GitHub
        </button>
      ) : (
        // Une erreur passe devant le titre : c'est elle qu'il faut lire en premier.
        <span
          className={`leading-tight ${isError ? 'text-[12cqmin] font-bold text-red-800' : 'text-[8cqmin] text-gray-700'}`}
        >
          {message}
        </span>
      )}
    </div>
  )
}
