import { pokemonLanguages, type PokemonLanguage } from '../../../constants/pokemon'

type PokemonLanguagePickerProps = {
  value: PokemonLanguage
  onChange: (language: PokemonLanguage) => void
}

function PokemonLanguagePicker({ value, onChange }: PokemonLanguagePickerProps) {
  return (
    <div className="mt-4">
      <p id="pokemon-language-label" className="text-sm font-medium text-gray-800">
        Langue de la carte
      </p>
      <div role="group" aria-labelledby="pokemon-language-label" className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {pokemonLanguages.map((language) => {
          const isSelected = language.code === value

          return (
            <button
              key={language.code}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(language.code)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 ${
                isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {language.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PokemonLanguagePicker
