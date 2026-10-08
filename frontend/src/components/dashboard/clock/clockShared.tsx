export type ClockLayoutProps = {
  timezone: string
  now: Date
  city: string
  time: string
  date: string
}

export const layoutClass = 'flex h-full w-full p-[7cqmin]'
export const cityClass = 'max-w-full truncate font-semibold uppercase leading-none tracking-wide text-gray-700'
export const timeClass = 'font-bold leading-none tabular-nums'
export const dateClass = 'max-w-full truncate leading-none text-gray-700'

function getTimeParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return { hour: read('hour'), minute: read('minute'), second: read('second') }
}

export function AnalogClock({ date, timezone, className }: { date: Date; timezone: string; className: string }) {
  const { hour, minute, second } = getTimeParts(date, timezone)
  const hourDeg = (hour % 12) * 30 + minute * 0.5
  const minuteDeg = minute * 6 + second * 0.1
  const secondDeg = second * 6

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle cx="50" cy="50" r="47" className="fill-white/70 stroke-gray-900" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, index) => (
        <line
          key={index}
          x1="50"
          y1="8"
          x2="50"
          y2={index % 3 === 0 ? 16 : 12}
          className="stroke-gray-900"
          strokeWidth={index % 3 === 0 ? 3 : 1.5}
          strokeLinecap="round"
          transform={`rotate(${index * 30} 50 50)`}
        />
      ))}
      <line
        x1="50"
        y1="54"
        x2="50"
        y2="27"
        className="stroke-gray-900"
        strokeWidth="4.5"
        strokeLinecap="round"
        transform={`rotate(${hourDeg} 50 50)`}
      />
      <line
        x1="50"
        y1="56"
        x2="50"
        y2="15"
        className="stroke-gray-900"
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(${minuteDeg} 50 50)`}
      />
      <line
        x1="50"
        y1="60"
        x2="50"
        y2="12"
        className="stroke-red-600"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform={`rotate(${secondDeg} 50 50)`}
      />
      <circle cx="50" cy="50" r="3" className="fill-red-600" />
    </svg>
  )
}
