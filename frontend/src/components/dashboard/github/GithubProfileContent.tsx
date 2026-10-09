import { BookMarked, Building2, CalendarDays, Link, MapPin, UserRoundCheck, Users } from 'lucide-react'
import { useStickyNoteData } from '../../../hooks/useStickyNoteData'
import {
  describeGithubError,
  formatCount,
  githubRefreshDelay,
  isGithubLoginRequired,
  redirectToGithubLogin,
} from './githubShared'

type GithubProfileContentProps = {
  noteId: string
  columns: number
  rows: number
}

type GithubProfileData = {
  login: string
  name: string | null
  type: string
  avatarUrl: string
  url: string
  bio: string | null
  company: string | null
  location: string | null
  publicRepos: number
  followers: number
  following: number
  createdAt: string
}

const memberSinceFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

// Une tuile par compteur. isCompact : libellé raccourci pour tenir sur le petit post-it.
function ProfileStats({
  profile,
  className,
  isCompact = false,
}: {
  profile: GithubProfileData
  className: string
  isCompact?: boolean
}) {
  const stats = [
    { icon: BookMarked, label: 'dépôts', value: profile.publicRepos },
    { icon: Users, label: 'abonnés', value: profile.followers },
    { icon: UserRoundCheck, label: isCompact ? 'suivis' : 'abonnements', value: profile.following },
  ]

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

type ProfileDetail = { icon: typeof Link; label: string; value: string | null; href?: string }

function ProfileDetails({ details, className }: { details: ProfileDetail[]; className: string }) {
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

function GithubProfileContent({ noteId, columns, rows }: GithubProfileContentProps) {
  const { data: profile, error } = useStickyNoteData<GithubProfileData>(noteId, githubRefreshDelay)

  if (!profile) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqmin] overflow-hidden p-[7cqmin] text-center text-gray-900 [container-type:size]">
        <span className="max-w-full truncate text-[10cqmin] font-semibold leading-none text-gray-700">
          Profil GitHub
        </span>
        {isGithubLoginRequired(error) ? (
          <button
            type="button"
            onClick={redirectToGithubLogin}
            className="rounded-sm bg-gray-900 px-[4cqmin] py-[2.5cqmin] text-[7cqmin] font-semibold leading-tight text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Se connecter avec GitHub
          </button>
        ) : (
          <span className="text-[8cqmin] leading-tight text-gray-700">
            {error === null ? 'Chargement...' : describeGithubError(error, 'Profil introuvable')}
          </span>
        )}
      </div>
    )
  }

  const avatar = (className: string) => (
    <img
      src={profile.avatarUrl}
      alt=""
      draggable={false}
      className={`shrink-0 rounded-full bg-white/70 object-cover shadow-sm ${className}`}
    />
  )
  const displayName = profile.name ?? profile.login
  // La description est facultative sur GitHub : on le signale plutôt que de laisser un vide.
  const bio = (
    <p className={`line-clamp-2 text-[5cqmin] leading-snug ${profile.bio ? '' : 'italic text-gray-700'}`}>
      {profile.bio ?? 'Aucune description sur ce profil.'}
    </p>
  )
  const placeDetails: ProfileDetail[] = [
    { icon: Building2, label: 'Organisation', value: profile.company },
    { icon: MapPin, label: 'Lieu', value: profile.location },
  ]
  // Grand format uniquement : le lien du profil se place sous la date d'inscription.
  const accountDetails: ProfileDetail[] = [
    {
      icon: CalendarDays,
      label: 'Inscription',
      value: `Sur GitHub depuis ${memberSinceFormat.format(new Date(profile.createdAt))}`,
    },
    {
      icon: Link,
      label: 'Adresse du profil',
      value: profile.url.replace(/^https?:\/\//, ''),
      href: profile.url,
    },
  ]
  const identity = (nameClass: string, loginClass: string) => (
    <div className="flex min-w-0 flex-col gap-[0.35em] leading-none">
      <span className={`truncate font-bold ${nameClass}`}>{displayName}</span>
      <span className={`truncate text-gray-700 ${loginClass}`}>@{profile.login}</span>
    </div>
  )

  return (
    <div className="absolute inset-0 overflow-hidden text-gray-900 [container-type:size]">
      {columns > rows ? (
        <div className="flex h-full w-full items-center gap-[6cqmin] p-[6cqmin]">
          <div className="flex shrink-0 flex-col items-center gap-[4cqmin]">
            {avatar('h-[40cqmin] w-[40cqmin]')}
            <span className="rounded-full bg-gray-900 px-[3.5cqmin] py-[1.5cqmin] text-[4.5cqmin] font-semibold leading-none text-white">
              {profile.type === 'Organization' ? 'Organisation' : 'Utilisateur'}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[4.5cqmin]">
            {identity('text-[9cqmin]', 'text-[5.5cqmin]')}
            {bio}
            <div className="flex gap-[4cqmin] text-[4.5cqmin]">
              <ProfileDetails details={placeDetails} className="flex flex-1 flex-col gap-[2.5cqmin]" />
              <ProfileDetails details={accountDetails} className="flex flex-1 flex-col gap-[2.5cqmin]" />
            </div>
            <ProfileStats profile={profile} className="text-[5.5cqmin]" />
          </div>
        </div>
      ) : columns > 1 ? (
        <div className="flex h-full w-full flex-col justify-center gap-[5cqmin] p-[7cqmin]">
          <div className="flex items-center gap-[5cqmin]">
            {avatar('h-[22cqmin] w-[22cqmin]')}
            {identity('text-[8.5cqmin]', 'text-[5.5cqmin]')}
          </div>
          {bio}
          <ProfileDetails details={placeDetails} className="grid grid-cols-2 gap-[3cqmin] text-[4.8cqmin]" />
          <ProfileStats profile={profile} className="text-[5.5cqmin]" />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[5cqmin] p-[6cqmin] text-center">
          {avatar('h-[24cqmin] w-[24cqmin]')}
          <span className="max-w-full truncate text-[10cqmin] font-bold leading-none">{displayName}</span>
          <ProfileStats profile={profile} className="text-[7.5cqmin]" isCompact />
        </div>
      )}
    </div>
  )
}

export default GithubProfileContent
