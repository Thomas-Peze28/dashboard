import { CircleDot, Code, Eye, GitBranch, GitFork, History, Link, Lock, Star } from 'lucide-react'
import { useStickyNoteData } from '../../../hooks/useStickyNoteData'
import { GithubDetails, GithubPlaceholder, GithubStats, type GithubDetail, type GithubStat } from './GithubParts'
import {
  describeGithubError,
  githubRefreshDelay,
  isGithubLoginRequired,
  redirectToGithubLogin,
} from './githubShared'

type GithubRepoContentProps = {
  noteId: string
  repository: string
  columns: number
  rows: number
}

type GithubRepoData = {
  repository: string
  description: string | null
  url: string
  owner: { login: string; avatarUrl: string }
  language: string | null
  stars: number
  forks: number
  openIssues: number
  watchers: number
  isPrivate: boolean
  defaultBranch: string
  pushedAt: string
}

const pushDateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function GithubRepoContent({ noteId, repository, columns, rows }: GithubRepoContentProps) {
  const { data: repo, error } = useStickyNoteData<GithubRepoData>(noteId, githubRefreshDelay)

  if (!repo) {
    return (
      <GithubPlaceholder
        title={repository}
        message={error === null ? 'Chargement...' : describeGithubError(error, 'Dépôt introuvable')}
        isError={error !== null}
        onLogin={isGithubLoginRequired(error) ? redirectToGithubLogin : undefined}
      />
    )
  }

  const name = repo.repository.slice(repo.repository.indexOf('/') + 1)
  const stats: GithubStat[] = [
    { icon: Star, label: 'étoiles', value: repo.stars },
    { icon: GitFork, label: 'forks', value: repo.forks },
    { icon: CircleDot, label: 'tickets', value: repo.openIssues },
  ]
  const codeDetails: GithubDetail[] = [
    { icon: Code, label: 'Langage principal', value: repo.language },
    { icon: GitBranch, label: 'Branche par défaut', value: repo.defaultBranch },
  ]
  // Grand format uniquement : le lien du dépôt se place sous la date du dernier push.
  const activityDetails: GithubDetail[] = [
    { icon: History, label: 'Dernier push', value: `Dernier push le ${pushDateFormat.format(new Date(repo.pushedAt))}` },
    { icon: Link, label: 'Adresse du dépôt', value: repo.url.replace(/^https?:\/\//, ''), href: repo.url },
  ]
  const avatar = (className: string) => (
    <img
      src={repo.owner.avatarUrl}
      alt=""
      draggable={false}
      className={`shrink-0 rounded-md bg-white/70 object-cover shadow-sm ${className}`}
    />
  )
  const identity = (nameClass: string, ownerClass: string) => (
    <div className="flex min-w-0 flex-col gap-[0.35em] leading-none">
      <span className={`flex min-w-0 items-center gap-[0.3em] font-bold ${nameClass}`}>
        <span className="truncate">{name}</span>
        {repo.isPrivate && (
          <Lock aria-label="Dépôt privé" className="h-[0.75em] w-[0.75em] shrink-0 text-gray-700" />
        )}
      </span>
      <span className={`truncate text-gray-700 ${ownerClass}`}>{repo.owner.login}</span>
    </div>
  )
  // La description est facultative sur GitHub : on le signale plutôt que de laisser un vide.
  const description = (
    <p className={`line-clamp-2 text-[5cqmin] leading-snug ${repo.description ? '' : 'italic text-gray-700'}`}>
      {repo.description ?? 'Aucune description pour ce dépôt.'}
    </p>
  )

  return (
    <div className="absolute inset-0 overflow-hidden text-gray-900 [container-type:size]">
      {columns > rows ? (
        <div className="flex h-full w-full items-center gap-[6cqmin] p-[6cqmin]">
          <div className="flex shrink-0 flex-col items-center gap-[4cqmin]">
            {avatar('h-[36cqmin] w-[36cqmin]')}
            <span className="rounded-full bg-gray-900 px-[3.5cqmin] py-[1.5cqmin] text-[4.5cqmin] font-semibold leading-none text-white">
              {repo.isPrivate ? 'Privé' : 'Public'}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[4.5cqmin]">
            {identity('text-[9cqmin]', 'text-[5.5cqmin]')}
            {description}
            <div className="flex gap-[4cqmin] text-[4.5cqmin]">
              <GithubDetails details={codeDetails} className="flex flex-1 flex-col gap-[2.5cqmin]" />
              <GithubDetails details={activityDetails} className="flex flex-1 flex-col gap-[2.5cqmin]" />
            </div>
            <GithubStats
              stats={[...stats, { icon: Eye, label: 'observateurs', value: repo.watchers }]}
              className="text-[5.5cqmin]"
            />
          </div>
        </div>
      ) : columns > 1 ? (
        <div className="flex h-full w-full flex-col justify-center gap-[5cqmin] p-[7cqmin]">
          <div className="flex items-center gap-[5cqmin]">
            {avatar('h-[20cqmin] w-[20cqmin]')}
            {identity('text-[8.5cqmin]', 'text-[5.5cqmin]')}
          </div>
          {description}
          <GithubDetails details={codeDetails} className="grid grid-cols-2 gap-[3cqmin] text-[4.8cqmin]" />
          <GithubStats stats={stats} className="text-[5.5cqmin]" />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[5cqmin] p-[6cqmin] text-center">
          <div className="flex max-w-full flex-col gap-[2cqmin] leading-none">
            <span className="truncate text-[11cqmin] font-bold">{name}</span>
            <span className="truncate text-[7cqmin] text-gray-700">{repo.owner.login}</span>
          </div>
          <GithubStats stats={stats} className="text-[7.5cqmin]" />
        </div>
      )}
    </div>
  )
}

export default GithubRepoContent
