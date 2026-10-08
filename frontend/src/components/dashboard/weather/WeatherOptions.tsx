import { minForecastDays } from '../../../constants/weather'

export type WeatherMode = 'current' | 'forecast'

type WeatherOptionsProps = {
  mode: WeatherMode
  city: string
  days: number
  maxDays: number
  onModeChange: (mode: WeatherMode) => void
  onCityChange: (city: string) => void
  onDaysChange: (days: number) => void
  onSubmit: () => void
}

const modeChoices: Array<{ mode: WeatherMode; label: string }> = [
  { mode: 'current', label: 'Météo actuelle' },
  { mode: 'forecast', label: 'Prévisions' },
]

function WeatherOptions({
  mode,
  city,
  days,
  maxDays,
  onModeChange,
  onCityChange,
  onDaysChange,
  onSubmit,
}: WeatherOptionsProps) {
  return (
    <div className="mt-4">
      <div role="group" aria-label="Type de météo" className="grid grid-cols-2 gap-2">
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

      <label htmlFor="weather-city" className="mt-4 block text-sm font-medium text-gray-800">
        Ville
      </label>
      <input
        id="weather-city"
        type="text"
        value={city}
        autoFocus
        autoComplete="off"
        placeholder="Lille, Paris, Tokyo..."
        onChange={(event) => onCityChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit()
        }}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
      />

      {mode === 'forecast' && (
        <>
          <label htmlFor="weather-days" className="mt-4 block text-sm font-medium text-gray-800">
            Nombre de jours : <span className="font-semibold">{days}</span>
          </label>
          <input
            id="weather-days"
            type="range"
            min={minForecastDays}
            max={maxDays}
            step={1}
            value={days}
            onChange={(event) => onDaysChange(Number(event.target.value))}
            className="mt-2 block w-full accent-yellow-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500" aria-hidden="true">
            <span>{minForecastDays}</span>
            <span>{maxDays}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default WeatherOptions
