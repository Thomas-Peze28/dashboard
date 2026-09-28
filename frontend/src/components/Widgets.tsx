import type { CSSProperties, DragEvent } from 'react'
import pinImage from '../assets/pin.png'

export type ClockVariant = 'analog' | 'digital-square' | 'digital-round'

export type ClockWidget = {
  id: number
  kind: 'clock'
  variant: ClockVariant
  city: string
  timeZone: string
  slot: number
}

export type WeatherWidget = {
  id: number
  kind: 'weather'
  city: string
  slot: number
}

export type DashboardWidget = ClockWidget | WeatherWidget

type WidgetsProps = {
  widgets: DashboardWidget[]
  time: Date
  gridColumns: number
  slotCount: number
  onMoveWidget: (targetSlot: number) => void
  draggedWidgetId: number | null
  onDragStart: (widgetId: number) => void
  onDragEnd: () => void
}

function getTimePartsInZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)

  return {
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? '0'),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? '0'),
    second: Number(parts.find((part) => part.type === 'second')?.value ?? '0'),
  }
}

function ClockDisplay({
  variant,
  time,
  timeZone,
  city,
}: {
  variant: ClockVariant
  time: Date
  timeZone: string
  city: string
}) {
  const { hour, minute, second } = getTimePartsInZone(time, timeZone)

  const hourDeg = (hour % 12) * 30 + minute * 0.5
  const minuteDeg = minute * 6 + second * 0.1
  const secondDeg = second * 6

  const displayTime = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(time)

  if (variant === 'analog') {
    return (
      <div className="clock clock--analog">
        <span className="clock__city-label">{city}</span>
        <div className="clock__face-wrap">
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
        <span className="clock__digital-time">{displayTime}</span>
      </div>
    )
  }

  if (variant === 'digital-square') {
    return (
      <div className="clock clock--digital-square">
        <span className="clock__city-label">{city}</span>
        <span>{displayTime}</span>
      </div>
    )
  }

  return (
    <div className="clock clock--digital-round">
      <span className="clock__city-label">{city}</span>
      <span>{displayTime}</span>
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

export function Widgets({
  widgets,
  time,
  gridColumns,
  slotCount,
  onMoveWidget,
  draggedWidgetId,
  onDragStart,
  onDragEnd,
}: WidgetsProps) {
  return (
    <div
      className="dashboard__widgets"
      style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: slotCount }, (_, slot) => {
        const widget = widgets.find((item) => item.slot === slot)

        return (
          <div
            key={slot}
            className="dashboard-slot"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onMoveWidget(slot)}
          >
            {widget ? (
              <div
                className={draggedWidgetId === widget.id ? 'widget-card dragging' : 'widget-card'}
                draggable
                onDragStart={(event: DragEvent<HTMLDivElement>) => {
                  event.dataTransfer.effectAllowed = 'move'
                  onDragStart(widget.id)
                }}
                onDragEnd={onDragEnd}
              >
                <img src={pinImage} alt="punaise" className="pin" />
                {widget.kind === 'clock' ? (
                  <ClockDisplay
                    variant={widget.variant}
                    time={time}
                    timeZone={widget.timeZone}
                    city={widget.city}
                  />
                ) : (
                  <WeatherDisplay city={widget.city} />
                )}
              </div>
            ) : (
              <div className="widget-slot-placeholder" aria-label={`Emplacement ${slot + 1}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
