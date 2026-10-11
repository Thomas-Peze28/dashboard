type CountSliderProps = {
  id: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function CountSlider({ id, label, value, min, max, onChange }: CountSliderProps) {
  return (
    <>
      <label htmlFor={id} className="mt-4 block text-sm font-medium text-gray-800">
        {label} : <span className="font-semibold">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 block w-full accent-yellow-500"
      />
      <div className="mt-1 flex justify-between text-xs text-gray-500" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </>
  )
}

export default CountSlider
