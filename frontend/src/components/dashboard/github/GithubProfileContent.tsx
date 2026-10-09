import { BookMarked, Building2, CalendarDays, Link, MapPin, UserRoundCheck, Users } from 'lucide-react'
import { useStickyNoteData } from '../../../hooks/useStickyNoteData'
import { isLoginRequired, loginLabels, redirectToLogin } from '../accountLink'
import WidgetPlaceholder from '../WidgetPlaceholder'
import { GithubDetails, GithubStats, type GithubDetail, type GithubStat } from './GithubParts'
import {
  describeGithubError,
  githubRefreshDelay,
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

function GithubProfileContent({ noteId, columns, rows }: GithubProfileContentProps) {
  const { data: profile, error } = useStickyNoteData<GithubProfileData>(noteId, githubRefreshDelay)

  if (!profile) {
    return (
      <WidgetPlaceholder
        title="Profil GitHub"
        message={error === null ? 'Chargement...' : describeGithubError(error, 'Profil introuvable')}
        isError={error !== null}
        loginLabel={loginLabels.github}
        onLogin={isLoginRequired('github', error) ? () => redirectToLogin('github') : undefined}
      />
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
  const stats = (followingLabel: string): GithubStat[] => [
    { icon: BookMarked, label: 'dépôts', value: profile.publicRepos },
    { icon: Users, label: 'abonnés', value: profile.followers },
    { icon: UserRoundCheck, label: followingLabel, value: profile.following },
  ]
  const placeDetails: GithubDetail[] = [
    { icon: Building2, label: 'Organisation', value: profile.company },
    { icon: MapPin, label: 'Lieu', value: profile.location },
  ]
  // Grand format uniquement : le lien du profil se place sous la date d'inscription.
  const accountDetails: GithubDetail[] = [
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
              <GithubDetails details={placeDetails} className="flex flex-1 flex-col gap-[2.5cqmin]" />
              <GithubDetails details={accountDetails} className="flex flex-1 flex-col gap-[2.5cqmin]" />
            </div>
            <GithubStats stats={stats('abonnements')} className="text-[5.5cqmin]" />
          </div>
        </div>
      ) : columns > 1 ? (
        <div className="flex h-full w-full flex-col justify-center gap-[5cqmin] p-[7cqmin]">
          <div className="flex items-center gap-[5cqmin]">
            {avatar('h-[22cqmin] w-[22cqmin]')}
            {identity('text-[8.5cqmin]', 'text-[5.5cqmin]')}
          </div>
          {bio}
          <GithubDetails details={placeDetails} className="grid grid-cols-2 gap-[3cqmin] text-[4.8cqmin]" />
          <GithubStats stats={stats('abonnements')} className="text-[5.5cqmin]" />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[5cqmin] p-[6cqmin] text-center">
          {avatar('h-[24cqmin] w-[24cqmin]')}
          <span className="max-w-full truncate text-[10cqmin] font-bold leading-none">{displayName}</span>
          <GithubStats stats={stats('suivis')} className="text-[7.5cqmin]" />
        </div>
      )}
    </div>
  )
}

export default GithubProfileContent
