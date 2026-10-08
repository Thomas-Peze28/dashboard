import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'
import type { StickyNoteSize } from '../types/stickyNote'

export const defaultCity = 'Paris'
export const minForecastDays = 1
export const maxForecastDays = 10
export const smallNoteMaxForecastDays = 5
export const defaultForecastDays = 5

export const clampForecastDays = (days: number) => Math.min(Math.max(days, minForecastDays), maxForecastDays)

// Le petit post-it (1 × 1) n'a pas la place d'afficher plus de 5 jours.
export const getMaxForecastDays = ({ columns, rows }: StickyNoteSize) =>
  columns === 1 && rows === 1 ? smallNoteMaxForecastDays : maxForecastDays

type WeatherIcon = typeof Sun

// Codes météo WMO renvoyés par Open-Meteo.
const weatherCodes: Record<number, { label: string; icon: WeatherIcon; nightIcon?: WeatherIcon }> = {
  0: { label: 'Ciel dégagé', icon: Sun, nightIcon: Moon },
  1: { label: 'Peu nuageux', icon: CloudSun, nightIcon: CloudMoon },
  2: { label: 'Partiellement nuageux', icon: CloudSun, nightIcon: CloudMoon },
  3: { label: 'Couvert', icon: Cloud },
  45: { label: 'Brouillard', icon: CloudFog },
  48: { label: 'Brouillard givrant', icon: CloudFog },
  51: { label: 'Bruine légère', icon: CloudDrizzle },
  53: { label: 'Bruine', icon: CloudDrizzle },
  55: { label: 'Bruine dense', icon: CloudDrizzle },
  56: { label: 'Bruine verglaçante', icon: CloudDrizzle },
  57: { label: 'Bruine verglaçante dense', icon: CloudDrizzle },
  61: { label: 'Pluie faible', icon: CloudRain },
  63: { label: 'Pluie', icon: CloudRain },
  65: { label: 'Forte pluie', icon: CloudRain },
  66: { label: 'Pluie verglaçante', icon: CloudRain },
  67: { label: 'Forte pluie verglaçante', icon: CloudRain },
  71: { label: 'Neige faible', icon: CloudSnow },
  73: { label: 'Neige', icon: CloudSnow },
  75: { label: 'Forte neige', icon: CloudSnow },
  77: { label: 'Grains de neige', icon: CloudSnow },
  80: { label: 'Averses légères', icon: CloudRain },
  81: { label: 'Averses', icon: CloudRain },
  82: { label: 'Averses violentes', icon: CloudRain },
  85: { label: 'Averses de neige', icon: CloudSnow },
  86: { label: 'Fortes averses de neige', icon: CloudSnow },
  95: { label: 'Orage', icon: CloudLightning },
  96: { label: 'Orage avec grêle', icon: CloudLightning },
  99: { label: 'Orage avec forte grêle', icon: CloudLightning },
}

export function describeWeather(code: number | null, isDay = true): { label: string; icon: WeatherIcon } {
  const weather = code === null ? undefined : weatherCodes[code]

  if (!weather) return { label: 'Inconnu', icon: Cloud }

  return { label: weather.label, icon: isDay ? weather.icon : (weather.nightIcon ?? weather.icon) }
}
