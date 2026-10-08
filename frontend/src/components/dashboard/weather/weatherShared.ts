export type WeatherCurrentData = {
  city: string
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
}

export type WeatherForecastDay = {
  date: string
  weatherCode: number | null
  temperatureMax: number | null
  temperatureMin: number | null
}

export type WeatherForecastData = {
  city: string
  days: WeatherForecastDay[]
}

export type WeatherSize = 'small' | 'medium' | 'large'

export const formatTemperature = (value: number | null) => (value === null ? '–' : `${Math.round(value)}°`)
