import { useEffect, useState } from 'react'
import { fetchStickyNoteData } from '../../../api/stickyNotes'
import type { StickyNoteContent } from '../../../types/stickyNote'
import CurrentWeather from './CurrentWeather'
import ForecastWeather from './ForecastWeather'
import type { WeatherCurrentData, WeatherForecastData, WeatherSize } from './weatherShared'

type WeatherContentProps = {
  noteId: string
  refreshInterval: number
  content: Extract<StickyNoteContent, { kind: 'weatherCurrent' | 'weatherForecast' }>
  columns: number
  rows: number
}

type WeatherData = WeatherCurrentData | WeatherForecastData

function WeatherContent({ noteId, refreshInterval, content, columns, rows }: WeatherContentProps) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCancelled = false
    const load = async () => {
      try {
        const loaded = await fetchStickyNoteData<WeatherData>(noteId)

        if (isCancelled) return

        setData(loaded)
        setError('')
      } catch (loadError) {
        if (isCancelled) return

        const message = loadError instanceof Error ? loadError.message : ''
        setError(message === 'City not found.' ? 'Ville introuvable' : 'Météo indisponible')
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), refreshInterval * 1000)

    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [noteId, refreshInterval])

  const size: WeatherSize = columns > rows ? 'large' : columns > 1 ? 'medium' : 'small'

  return (
    <div className="absolute inset-0 overflow-hidden text-gray-900 [container-type:size]">
      {!data ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[4cqmin] p-[7cqmin] text-center">
          <span className="max-w-full truncate text-[10cqmin] font-semibold uppercase leading-none tracking-wide text-gray-700">
            {content.city}
          </span>
          <span className="text-[8cqmin] leading-tight text-gray-700">{error || 'Chargement...'}</span>
        </div>
      ) : 'days' in data ? (
        <ForecastWeather data={data} size={size} />
      ) : (
        <CurrentWeather data={data} size={size} />
      )}
    </div>
  )
}

export default WeatherContent
