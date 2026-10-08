import { Droplets, Thermometer, Wind } from 'lucide-react'
import { describeWeather } from '../../../constants/weather'
import { cityClass, dateClass, layoutClass, timeClass } from '../clock/clockShared'
import { formatTemperature, type WeatherCurrentData, type WeatherSize } from './weatherShared'

type CurrentWeatherProps = {
  data: WeatherCurrentData
  size: WeatherSize
}

function WeatherDetails({ data, className }: { data: WeatherCurrentData; className: string }) {
  const details = [
    { icon: Thermometer, label: 'Ressenti', value: formatTemperature(data.apparentTemperature) },
    { icon: Droplets, label: 'Humidité', value: `${Math.round(data.humidity)} %` },
    { icon: Wind, label: 'Vent', value: `${Math.round(data.windSpeed)} km/h` },
  ]

  return (
    <ul className={`flex max-w-full items-center justify-center leading-none text-gray-700 ${className}`}>
      {details.map(({ icon: Icon, label, value }) => (
        <li key={label} title={label} className="flex items-center gap-[0.3em] whitespace-nowrap">
          <Icon aria-hidden="true" className="h-[1.1em] w-[1.1em]" />
          <span className="sr-only">{label} :</span>
          {value}
        </li>
      ))}
    </ul>
  )
}

function CurrentWeather({ data, size }: CurrentWeatherProps) {
  const { label, icon: Icon } = describeWeather(data.weatherCode, data.isDay)
  const temperature = formatTemperature(data.temperature)

  if (size === 'small') {
    return (
      <div className={`${layoutClass} flex-col items-center justify-center gap-[6cqmin] text-center`}>
        <span className={`${cityClass} text-[12cqmin]`}>{data.city}</span>
        <div className="flex items-center gap-[5cqmin]">
          <Icon aria-hidden="true" className="h-[26cqmin] w-[26cqmin]" />
          <span className={`${timeClass} text-[24cqmin]`}>{temperature}</span>
        </div>
        <span className={`${dateClass} text-[9cqmin]`}>{label}</span>
      </div>
    )
  }

  if (size === 'medium') {
    return (
      <div className={`${layoutClass} flex-col items-center justify-center gap-[4cqmin] text-center`}>
        <span className={`${cityClass} text-[9cqmin]`}>{data.city}</span>
        <div className="flex items-center gap-[5cqmin]">
          <Icon aria-hidden="true" className="h-[30cqmin] w-[30cqmin]" />
          <span className={`${timeClass} text-[24cqmin]`}>{temperature}</span>
        </div>
        <span className={`${dateClass} text-[8cqmin]`}>{label}</span>
        <WeatherDetails data={data} className="gap-[4cqmin] text-[5.5cqmin]" />
      </div>
    )
  }

  return (
    <div className={`${layoutClass} items-center gap-[6cqmin]`}>
      <Icon aria-hidden="true" className="h-[52cqmin] w-[52cqmin] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col items-center gap-[5cqmin] text-center">
        <span className={`${cityClass} text-[9cqmin]`}>{data.city}</span>
        <span className={`${timeClass} text-[24cqmin]`}>{temperature}</span>
        <span className={`${dateClass} text-[8cqmin]`}>{label}</span>
        <WeatherDetails data={data} className="flex-wrap gap-x-[5cqmin] gap-y-[2cqmin] text-[6cqmin]" />
      </div>
    </div>
  )
}

export default CurrentWeather
