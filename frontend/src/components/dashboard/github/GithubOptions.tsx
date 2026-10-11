import { maxGithubNotificationsLimit, minGithubNotificationsLimit } from '../../../constants/github'
import CountSlider from '../CountSlider'

export type GithubMode = 'profile' | 'repo' | 'notifications'

type GithubOptionsProps = {
  mode: GithubMode
  repository: string
  username: string
  notificationsLimit: number
  onModeChange: (mode: GithubMode) => void
  onRepositoryChange: (repository: string) => void
  onUsernameChange: (username: string) => void
  onNotificationsLimitChange: (limit: number) => void
  onSubmit: () => void
}

const modeChoices: Array<{ mode: GithubMode; label: string; description: string }> = [
  { mode: 'profile', label: 'Profil', description: 'Affiche un profil GitHub : le vôtre, ou celui d’un autre utilisateur.' },
  { mode: 'repo', label: 'Dépôt', description: 'Affiche les statistiques d’un dépôt.' },
  { mode: 'notifications', label: 'Notifications', description: 'Affiche vos notifications GitHub non lues.' },
]

function GithubOptions({
  mode,
  repository,
  username,
  notificationsLimit,
  onModeChange,
  onRepositoryChange,
  onUsernameChange,
  onNotificationsLimitChange,
  onSubmit,
}: GithubOptionsProps) {
  return (
    <div className="mt-4">
      <div role="group" aria-label="Widget GitHub" className="grid grid-cols-3 gap-2">
        {modeChoices.map((choice) => {
          const isSelected = choice.mode === mode

          return (
            <button
              key={choice.mode}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onModeChange(choice.mode)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 ${
                isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {choice.label}
            </button>
          )
        })}
      </div>

      {mode === 'profile' && (
        <>
          <label htmlFor="github-username" className="mt-4 block text-sm font-medium text-gray-800">
            Utilisateur GitHub <span className="font-normal text-gray-500">(facultatif)</span>
          </label>
          <input
            id="github-username"
            type="text"
            value={username}
            autoFocus
            autoComplete="off"
            placeholder="torvalds"
            onChange={(event) => onUsernameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSubmit()
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          />
          <p className="mt-1 text-xs text-gray-500">Laissez vide pour afficher votre propre profil.</p>
        </>
      )}

      {mode === 'repo' && (
        <>
          <label htmlFor="github-repository" className="mt-4 block text-sm font-medium text-gray-800">
            Dépôt GitHub
          </label>
          <input
            id="github-repository"
            type="text"
            value={repository}
            autoFocus
            autoComplete="off"
            placeholder="facebook/react"
            onChange={(event) => onRepositoryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSubmit()
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          />
          <p className="mt-1 text-xs text-gray-500">Au format propriétaire/dépôt.</p>
        </>
      )}

      {mode === 'notifications' && (
        <CountSlider
          id="github-notifications-limit"
          label="Nombre maximum de notifications"
          value={notificationsLimit}
          min={minGithubNotificationsLimit}
          max={maxGithubNotificationsLimit}
          onChange={onNotificationsLimitChange}
        />
      )}

      <p className="mt-4 text-sm text-gray-600">
        {modeChoices.find((choice) => choice.mode === mode)?.description} Si votre compte GitHub n’est pas encore
        relié, vous serez redirigé vers GitHub pour vous connecter.
      </p>
    </div>
  )
}

export default GithubOptions
