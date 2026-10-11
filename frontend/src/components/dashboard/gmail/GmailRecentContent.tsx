import { Mail } from 'lucide-react'
import { useStickyNoteData } from '../../../hooks/useStickyNoteData'
import { isLoginRequired, loginLabels, redirectToLogin } from '../accountLink'
import WidgetPlaceholder from '../WidgetPlaceholder'
import { describeGmailError } from './gmailShared'

type GmailRecentContentProps = {
  noteId: string
  refreshInterval: number
  limit: number
  columns: number
  rows: number
}

type GmailEmail = {
  id: string
  from: string
  subject: string
  date: string
  unread: boolean
  url: string
}

type GmailRecentData = {
  emails: GmailEmail[]
}

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

const formatDate = (value: string) => {
  const date = new Date(value)

  return date.toDateString() === new Date().toDateString() ? timeFormat.format(date) : dayFormat.format(date)
}

function EmailList({ emails, className }: { emails: GmailEmail[]; className: string }) {
  return (
    <ul className={`min-h-0 leading-none ${className}`}>
      {emails.map((email) => (
        <li key={email.id} className="flex min-w-0 items-center gap-[0.6em]">
          <span
            aria-hidden="true"
            className={`flex h-[1.9em] w-[1.9em] shrink-0 items-center justify-center rounded-full font-bold uppercase shadow-sm ${
              email.unread ? 'bg-gray-900 text-white' : 'bg-white/55 text-gray-700'
            }`}
          >
            {email.from.trim().charAt(0) || '?'}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[0.35em]">
            <div className="flex min-w-0 items-baseline justify-between gap-[0.6em]">
              <span className={`truncate ${email.unread ? 'font-bold' : 'font-medium text-gray-800'}`}>
                {email.from}
                {email.unread && <span className="sr-only"> (non lu)</span>}
              </span>
              <time dateTime={email.date} className="shrink-0 text-[0.75em] tabular-nums text-gray-700">
                {formatDate(email.date)}
              </time>
            </div>
            <a
              href={email.url}
              target="_blank"
              rel="noopener noreferrer"
              title={email.subject}
              className={`truncate text-[0.85em] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
                email.unread ? 'font-semibold' : 'text-gray-700'
              }`}
            >
              {email.subject || '(sans objet)'}
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}

function GmailRecentContent({ noteId, refreshInterval, limit, columns, rows }: GmailRecentContentProps) {
  const { data, error } = useStickyNoteData<GmailRecentData>(noteId, refreshInterval * 1000)

  if (!data) {
    return (
      <WidgetPlaceholder
        title="Gmail"
        message={error === null ? 'Chargement...' : describeGmailError(error)}
        isError={error !== null}
        loginLabel={loginLabels.google}
        onLogin={isLoginRequired('google', error) ? () => redirectToLogin('google') : undefined}
      />
    )
  }

  if (data.emails.length === 0) {
    return <WidgetPlaceholder title="Gmail" message="Aucun message dans la boîte de réception" />
  }

  const isLarge = columns > rows

  if (columns === 1) {
    return (
      <div className="absolute inset-0 overflow-hidden px-[3cqmin] py-[6cqmin] text-gray-900 [container-type:size]">
        <EmailList
          emails={data.emails.slice(0, Math.min(limit, 2))}
          className="grid h-full grid-rows-2 gap-[4cqmin] text-[17.3cqmin] [&>li]:gap-[0.35em]"
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col gap-[4.5cqmin] overflow-hidden p-[7cqmin] text-gray-900 [container-type:size]">
      <div className="flex items-center gap-[3cqmin] leading-none">
        <Mail aria-hidden="true" className="h-[9cqmin] w-[9cqmin] shrink-0" />
        <span className="truncate text-[8cqmin] font-bold">Derniers messages</span>
      </div>
      <EmailList
        emails={data.emails.slice(0, Math.min(limit, isLarge ? 6 : 4))}
        className={
          isLarge
            ? 'grid flex-1 grid-cols-2 grid-rows-3 gap-x-[6cqmin] gap-y-[4cqmin] text-[6cqmin]'
            : 'grid flex-1 grid-rows-4 gap-[3cqmin] text-[6cqmin]'
        }
      />
    </div>
  )
}

export default GmailRecentContent
