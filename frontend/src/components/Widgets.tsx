import type { CSSProperties } from 'react'

export type ClockVariant = 'analog' | 'digital-square' | 'digital-round'

export type ClockWidget = {
  id: number
  kind: 'clock'
  variant: ClockVariant
}

export type WeatherWidget = {
  id: number
  kind: 'weather'
  city: string
}

export type DashboardWidget = ClockWidget | WeatherWidget

type WidgetsProps = {
  widgets: DashboardWidget[]
  time: Date
}

function ClockDisplay({ variant, time }: { variant: ClockVariant; time: Date }) {
  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourDeg = hours * 30 + minutes * 0.5
  const minuteDeg = minutes * 6 + seconds * 0.1
  const secondDeg = seconds * 6

  if (variant === 'analog') {
    return (
      <div className="clock clock--analog">
        <div className="clock__face">
          <div
            className="clock__hand clock__hand--hour"
            style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` } as CSSProperties}
          />
          <div
            className="clock__hand clock__hand--minute"
            style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` } as CSSProperties}
          />
          <div
            className="clock__hand clock__hand--second"
            style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` } as CSSProperties}
          />
          <div className="clock__center" />
        </div>
      </div>
    )
  }

  if (variant === 'digital-square') {
    return (
      <div className="clock clock--digital-square">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    )
  }

  return (
    <div className="clock clock--digital-round">
      <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  )
}

function WeatherDisplay({ city }: { city: string }) {
  return (
    <div className="weather-widget">
      <div className="weather-widget__title">Météo</div>
      <div className="weather-widget__city">{city}</div>
      <div className="weather-widget__temp">18°C</div>
      <div className="weather-widget__status">Nuageux</div>
    </div>
  )
}

export function Widgets({ widgets, time }: WidgetsProps) {
  return (
    <div className="dashboard__widgets">
      {widgets.map((widget) => (
        <div key={widget.id} className="widget-card">
          {widget.kind === 'clock' ? (
            <ClockDisplay variant={widget.variant} time={time} />
          ) : (
            <WeatherDisplay city={widget.city} />
          )}
        </div>
      ))}
    </div>
  )
}
