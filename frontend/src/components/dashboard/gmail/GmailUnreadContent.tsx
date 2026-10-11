import { Mail, MailCheck } from 'lucide-react'
import { useStickyNoteData } from '../../../hooks/useStickyNoteData'
import { isLoginRequired, loginLabels, redirectToLogin } from '../accountLink'
import WidgetPlaceholder from '../WidgetPlaceholder'
import { describeGmailError, gmailInboxUrl } from './gmailShared'

type GmailUnreadContentProps = {
  noteId: string
  refreshInterval: number
  columns: number
  rows: number
}

const countFormat = new Intl.NumberFormat('fr-FR')

function GmailUnreadContent({ noteId, refreshInterval, columns, rows }: GmailUnreadContentProps) {
  const { data, error } = useStickyNoteData<{ unread: number }>(noteId, refreshInterval * 1000)

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

  const Icon = data.unread === 0 ? MailCheck : Mail
  const count = countFormat.format(data.unread)
  const label = data.unread === 0 ? 'Boîte de réception à jour' : data.unread > 1 ? 'messages non lus' : 'message non lu'
  const inboxLink = (className: string) => (
    <a
      href={gmailInboxUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-full bg-gray-900 px-[1em] py-[0.5em] font-semibold leading-none text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${className}`}
    >
      Ouvrir Gmail
    </a>
  )

  return (
    <div className="absolute inset-0 overflow-hidden text-gray-900 [container-type:size]">
      {columns > rows ? (
        <div className="flex h-full w-full items-center justify-center gap-[8cqmin] p-[7cqmin]">
          <Icon aria-hidden="true" className="h-[46cqmin] w-[46cqmin] shrink-0" />
          <div className="flex min-w-0 flex-col items-start gap-[5cqmin]">
            <span className="text-[30cqmin] font-bold leading-none tabular-nums">{count}</span>
            <span className="text-[8cqmin] leading-none text-gray-700">{label}</span>
            {inboxLink('text-[5.5cqmin]')}
          </div>
        </div>
      ) : columns > 1 ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[5cqmin] p-[7cqmin] text-center">
          <Icon aria-hidden="true" className="h-[24cqmin] w-[24cqmin]" />
          <span className="text-[26cqmin] font-bold leading-none tabular-nums">{count}</span>
          <span className="text-[7.5cqmin] leading-none text-gray-700">{label}</span>
          {inboxLink('text-[5.5cqmin]')}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[5cqmin] p-[6cqmin] text-center">
          <Icon aria-hidden="true" className="h-[22cqmin] w-[22cqmin]" />
          <span className="text-[26cqmin] font-bold leading-none tabular-nums">{count}</span>
          <span className="text-[8cqmin] leading-none text-gray-700">
            {data.unread === 0 ? 'à jour' : data.unread > 1 ? 'non lus' : 'non lu'}
          </span>
        </div>
      )}
    </div>
  )
}

export default GmailUnreadContent
