import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, CloudSun, Dices, X } from 'lucide-react'
import { defaultPokemonLanguage } from '../../constants/pokemon'
import { localTimezone } from '../../constants/timezones'
import { defaultForecastDays, getMaxForecastDays } from '../../constants/weather'
import type { StickyNoteContent, StickyNoteSize } from '../../types/stickyNote'
import TimezonePicker from './clock/TimezonePicker'
import PokemonLanguagePicker from './pokemon/PokemonLanguagePicker'
import WeatherOptions, { type WeatherMode } from './weather/WeatherOptions'

type StickyNoteContentDialogProps = {
  size: StickyNoteSize
  initialContent?: StickyNoteContent
  backLabel: string
  submitLabel: string
  isSaving: boolean
  onSelect: (content: StickyNoteContent) => void
  onBack: () => void
  onClose: () => void
}

type WidgetChoice = 'clock' | 'weather' | 'pokemon'

const widgetChoices: Array<{ widget: WidgetChoice; label: string; icon: typeof Clock }> = [
  { widget: 'clock', label: 'Horloge', icon: Clock },
  { widget: 'weather', label: 'Météo', icon: CloudSun },
  { widget: 'pokemon', label: 'Pokémon aléatoire', icon: Dices },
]

function StickyNoteContentDialog({
  size,
  initialContent,
  backLabel,
  submitLabel,
  isSaving,
  onSelect,
  onBack,
  onClose,
}: StickyNoteContentDialogProps) {
  const maxDays = getMaxForecastDays(size)
  const [widget, setWidget] = useState<WidgetChoice>(
    !initialContent || initialContent.kind === 'clock'
      ? 'clock'
      : 'language' in initialContent
        ? 'pokemon'
        : 'weather',
  )
  const [timezone, setTimezone] = useState(
    initialContent?.kind === 'clock' ? initialContent.timezone : localTimezone,
  )
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(
    initialContent?.kind === 'weatherForecast' ? 'forecast' : 'current',
  )
  const [city, setCity] = useState(initialContent && 'city' in initialContent ? initialContent.city : '')
  const [days, setDays] = useState(
    Math.min(initialContent?.kind === 'weatherForecast' ? initialContent.days : defaultForecastDays, maxDays),
  )
  const [language, setLanguage] = useState(
    initialContent && 'language' in initialContent ? initialContent.language : defaultPokemonLanguage,
  )
  const canSubmit = !isSaving && (widget !== 'weather' || city.trim() !== '')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = () => {
    if (!canSubmit) return

    if (widget === 'clock') onSelect({ kind: 'clock', timezone })
    else if (widget === 'pokemon') onSelect({ kind: 'pokemonRandom', language })
    else if (weatherMode === 'current') onSelect({ kind: 'weatherCurrent', city: city.trim() })
    else onSelect({ kind: 'weatherForecast', city: city.trim(), days })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sticky-note-content-dialog-title"
        aria-describedby="sticky-note-content-dialog-description"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="sticky-note-content-dialog-title" className="text-lg font-semibold text-gray-900">
              Choisir le contenu du post-it
            </h2>
            <p id="sticky-note-content-dialog-description" className="mt-1 text-sm text-gray-600">
              Le widget sera affiché sur le post-it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {widgetChoices.map((choice) => {
            const Icon = choice.icon
            const isSelected = choice.widget === widget

            return (
              <button
                key={choice.widget}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setWidget(choice.widget)}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-md border p-3 text-gray-800 transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 ${
                  isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <Icon size={28} aria-hidden="true" />
                <span className="text-center text-sm font-semibold">{choice.label}</span>
              </button>
            )
          })}
        </div>

        {widget === 'clock' ? (
          <TimezonePicker value={timezone} onChange={setTimezone} />
        ) : widget === 'pokemon' ? (
          <PokemonLanguagePicker value={language} onChange={setLanguage} />
        ) : (
          <WeatherOptions
            mode={weatherMode}
            city={city}
            days={days}
            maxDays={maxDays}
            onModeChange={setWeatherMode}
            onCityChange={setCity}
            onDaysChange={setDays}
            onSubmit={handleSubmit}
          />
        )}

        <footer className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 disabled:opacity-60"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:opacity-60"
          >
            {isSaving ? 'Enregistrement...' : submitLabel}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default StickyNoteContentDialog
