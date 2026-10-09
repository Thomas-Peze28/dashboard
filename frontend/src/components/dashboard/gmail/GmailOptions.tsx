export type GmailMode = 'unread' | 'recent'

type GmailOptionsProps = {
  mode: GmailMode
  onModeChange: (mode: GmailMode) => void
}

const modeChoices: Array<{ mode: GmailMode; label: string; description: string }> = [
  { mode: 'unread', label: 'Non lus', description: 'Affiche le nombre de messages non lus de votre boîte Gmail.' },
  { mode: 'recent', label: 'Derniers messages', description: 'Affiche les derniers messages reçus dans votre boîte Gmail.' },
]

function GmailOptions({ mode, onModeChange }: GmailOptionsProps) {
  return (
    <div className="mt-4">
      <div role="group" aria-label="Widget Gmail" className="grid grid-cols-2 gap-2">
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

      <p className="mt-4 text-sm text-gray-600">
        {modeChoices.find((choice) => choice.mode === mode)?.description} Si votre compte Google n’est pas encore
        relié, vous serez redirigé vers Google pour vous connecter.
      </p>
    </div>
  )
}

export default GmailOptions
