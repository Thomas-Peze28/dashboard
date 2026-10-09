import { Bell, CircleDot, GitCommitHorizontal, GitPullRequest, MessageSquare, Tag } from 'lucide-react'
import { githubNotificationsLimit } from '../../../constants/github'
import { useStickyNoteData } from '../../../hooks/useStickyNoteData'
import { GithubPlaceholder } from './GithubParts'
import {
  describeGithubError,
  isGithubLoginRequired,
  redirectToGithubLogin,
} from './githubShared'

type GithubNotificationsContentProps = {
  noteId: string
  columns: number
  rows: number
}

type GithubNotification = {
  id: string
  title: string
  type: string
  reason: string
  repository: string
  url: string
}

type GithubNotificationsData = {
  count: number
  notifications: GithubNotification[]
}

// Les notifications bougent vite : on les recharge plus souvent que le profil ou un dépôt.
const refreshDelay = 2 * 60 * 1000

const typeIcons: Record<string, typeof Bell> = {
  Issue: CircleDot,
  PullRequest: GitPullRequest,
  Release: Tag,
  Discussion: MessageSquare,
  Commit: GitCommitHorizontal,
}

const reasonLabels: Record<string, string> = {
  assign: 'assignation',
  author: 'auteur',
  comment: 'commentaire',
  ci_activity: 'CI',
  mention: 'mention',
  team_mention: 'mention d’équipe',
  review_requested: 'relecture demandée',
  state_change: 'changement d’état',
  subscribed: 'abonnement',
}

function NotificationList({ notifications, className }: { notifications: GithubNotification[]; className: string }) {
  return (
    <ul className={`min-h-0 leading-none ${className}`}>
      {notifications.map((notification) => {
        const Icon = typeIcons[notification.type] ?? Bell

        return (
          <li key={notification.id} className="flex min-w-0 items-center gap-[0.6em]">
            <span className="flex h-[1.9em] w-[1.9em] shrink-0 items-center justify-center rounded-full bg-white/55 shadow-sm">
              <Icon aria-hidden="true" className="h-[1.05em] w-[1.05em]" />
            </span>
            <div className="flex min-w-0 flex-col gap-[0.35em]">
              <a
                href={notification.url}
                target="_blank"
                rel="noopener noreferrer"
                title={notification.title}
                className="truncate font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              >
                {notification.title}
              </a>
              <span className="truncate text-[0.8em] text-gray-700">
                {notification.repository} · {reasonLabels[notification.reason] ?? notification.reason}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function GithubNotificationsContent({ noteId, columns, rows }: GithubNotificationsContentProps) {
  const { data, error } = useStickyNoteData<GithubNotificationsData>(noteId, refreshDelay)

  if (!data) {
    return (
      <GithubPlaceholder
        title="Notifications GitHub"
        message={error === null ? 'Chargement...' : describeGithubError(error, 'Notifications introuvables')}
        isError={error !== null}
        onLogin={isGithubLoginRequired(error) ? redirectToGithubLogin : undefined}
      />
    )
  }

  // Le backend ne renvoie pas plus que la limite demandée : au-delà, le total exact est inconnu.
  const count = data.count >= githubNotificationsLimit ? `${githubNotificationsLimit}+` : String(data.count)
  const unreadLabel = data.count > 1 ? 'non lues' : 'non lue'
  const isLarge = columns > rows

  if (columns === 1) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5cqmin] overflow-hidden p-[6cqmin] text-center text-gray-900 [container-type:size]">
        <Bell aria-hidden="true" className="h-[22cqmin] w-[22cqmin]" />
        <span className="text-[26cqmin] font-bold leading-none tabular-nums">{count}</span>
        <span className="text-[8cqmin] leading-none text-gray-700">{unreadLabel}</span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col gap-[4.5cqmin] overflow-hidden p-[7cqmin] text-gray-900 [container-type:size]">
      <div className="flex items-center gap-[3cqmin] leading-none">
        <Bell aria-hidden="true" className="h-[9cqmin] w-[9cqmin] shrink-0" />
        <span className="text-[9cqmin] font-bold tabular-nums">{count}</span>
        <span className="truncate text-[6cqmin] text-gray-700">
          {data.count > 1 ? 'notifications' : 'notification'} {unreadLabel}
        </span>
      </div>
      {data.count === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-[6.5cqmin] italic leading-snug text-gray-700">
          Vous êtes à jour, aucune notification à lire.
        </p>
      ) : (
        <NotificationList
          notifications={data.notifications.slice(0, isLarge ? 8 : 4)}
          className={
            isLarge
              ? 'grid flex-1 grid-cols-2 grid-rows-4 gap-x-[5cqmin] gap-y-[3cqmin] text-[4.8cqmin]'
              : 'grid flex-1 grid-rows-4 gap-[3cqmin] text-[5cqmin]'
          }
        />
      )}
    </div>
  )
}

export default GithubNotificationsContent
