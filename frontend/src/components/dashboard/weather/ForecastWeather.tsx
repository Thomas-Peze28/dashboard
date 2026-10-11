import { describeWeather, smallNoteMaxForecastDays } from '../../../constants/weather'
import { cityClass, layoutClass } from '../clock/clockShared'
import {
  formatTemperature,
  type WeatherForecastData,
  type WeatherForecastDay,
  type WeatherSize,
} from './weatherShared'

type ForecastWeatherProps = {
  data: WeatherForecastData
  size: WeatherSize
}

const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

const formatWeekday = (date: string) => weekdayFormat.format(new Date(`${date}T12:00:00`))

function ForecastDay({ day, isRow }: { day: WeatherForecastDay; isRow: boolean }) {
  const { label, icon: Icon } = describeWeather(day.weatherCode)

  return (
    <li title={label} className="min-h-0 min-w-0 [container-type:size]">
      <div
        style={{ fontSize: isRow ? 'min(55cqh, 11cqw)' : 'min(13cqh, 24cqw)' }}
        className={`flex h-full w-full items-center justify-center leading-none ${
          isRow ? 'gap-[0.5em]' : 'flex-col gap-[0.25em]'
        }`}
      >
        <span className={`font-semibold uppercase text-gray-700 ${isRow ? 'w-[2.6em] text-left' : ''}`}>
          {formatWeekday(day.date)}
        </span>
        <Icon aria-hidden="true" className={isRow ? 'h-[1.3em] w-[1.3em]' : 'h-[2.2em] w-[2.2em]'} />
        <span className="sr-only">{label}</span>
        <span className={`font-bold tabular-nums ${isRow ? 'w-[1.9em] text-right' : 'text-[1.3em]'}`}>
          {formatTemperature(day.temperatureMax)}
        </span>
        <span className={`tabular-nums text-gray-700 ${isRow ? 'w-[1.9em] text-right' : ''}`}>
          {formatTemperature(day.temperatureMin)}
        </span>
      </div>
    </li>
  )
}

function ForecastWeather({ data, size }: ForecastWeatherProps) {
  const isRow = size === 'small'
  const days = isRow ? data.days.slice(0, smallNoteMaxForecastDays) : data.days
  const lines = !isRow && days.length > (size === 'medium' ? 4 : 5) ? 2 : 1
  const columns = isRow ? 1 : Math.ceil(days.length / lines)
  const rows = isRow ? days.length : lines

  return (
    <div className={`${layoutClass} flex-col gap-[4cqmin]`}>
      <span className={`${cityClass} text-center ${isRow ? 'text-[10cqmin]' : 'text-[8cqmin]'}`}>{data.city}</span>
      <ul
        className="grid min-h-0 flex-1 gap-[2cqmin]"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {days.map((day) => (
          <ForecastDay key={day.date} day={day} isRow={isRow} />
        ))}
      </ul>
    </div>
  )
}

export default ForecastWeather
