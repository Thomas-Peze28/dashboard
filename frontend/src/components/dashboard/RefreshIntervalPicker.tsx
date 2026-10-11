import { refreshOptions } from '../../constants/refresh'

type RefreshIntervalPickerProps = {
  value: number
  onChange: (seconds: number) => void
}

function RefreshIntervalPicker({ value, onChange }: RefreshIntervalPickerProps) {
  // Une valeur enregistrée hors liste (ex : l'ancien défaut) reste sélectionnable.
  const options = refreshOptions.some((option) => option.seconds === value)
    ? refreshOptions
    : [{ seconds: value, label: `${value} secondes` }, ...refreshOptions]

  return (
    <div className="mt-4">
      <label htmlFor="refresh-interval" className="block text-sm font-medium text-gray-800">
        Rafraîchissement des données
      </label>
      <select
        id="refresh-interval"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
      >
        {options.map((option) => (
          <option key={option.seconds} value={option.seconds}>
            Toutes les {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default RefreshIntervalPicker
