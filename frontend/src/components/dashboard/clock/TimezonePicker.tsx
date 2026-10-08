import { useState } from 'react'
import { Search } from 'lucide-react'
import { getTimezoneLabel, normalizeSearch, timezoneOptions } from '../../../constants/timezones'

type TimezonePickerProps = {
  value: string
  onChange: (timezone: string) => void
}

function TimezonePicker({ value, onChange }: TimezonePickerProps) {
  const [query, setQuery] = useState('')

  const words = normalizeSearch(query).split(/\s+/).filter(Boolean)
  const results =
    words.length === 0
      ? timezoneOptions.filter((option) => option.isPopular)
      : timezoneOptions.filter((option) => words.every((word) => option.search.includes(word)))

  return (
    <div className="mt-4">
      <label htmlFor="timezone-search" className="block text-sm font-medium text-gray-800">
        Fuseau horaire : <span className="font-semibold">{getTimezoneLabel(value)}</span>
      </label>
      <div className="relative mt-1">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          id="timezone-search"
          type="search"
          value={query}
          autoFocus
          autoComplete="off"
          placeholder="Rechercher une ville, un pays, un fuseau..."
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results.length > 0) onChange(results[0].timezone)
          }}
          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
        />
      </div>
      <ul
        role="listbox"
        aria-label="Fuseaux horaires"
        className="mt-2 h-36 overflow-y-auto rounded-md border border-gray-200"
      >
        {results.map((option) => {
          const isSelected = option.timezone === value

          return (
            <li key={option.timezone} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => onChange(option.timezone)}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm text-gray-900 transition hover:bg-yellow-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-yellow-600 ${
                  isSelected ? 'bg-yellow-100 font-semibold' : ''
                }`}
              >
                <span className="truncate">{option.label}</span>
                <span className="shrink-0 text-xs font-normal text-gray-500">{option.timezone}</span>
              </button>
            </li>
          )
        })}
        {results.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Aucun fuseau trouvé.</li>}
      </ul>
    </div>
  )
}

export default TimezonePicker
