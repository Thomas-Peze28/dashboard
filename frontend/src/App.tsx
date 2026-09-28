import { useEffect, useState } from 'react'
import './App.css'
import { Widgets, type ClockVariant, type DashboardWidget } from './components/Widgets'

const clockOptions = [
  { value: 'analog', label: 'Horloge ronde avec aiguilles' },
  { value: 'digital-square', label: 'Heure en chiffre dans un carré' },
  { value: 'digital-round', label: 'Heure en chiffre dans un rond' },
] as const

const apiKey = (
  (import.meta.env as Record<string, string | undefined>).VITE_TIME_API_KEY ??
  (import.meta.env as Record<string, string | undefined>).TIME_API_KEY ??
  ''
).trim()

const getGridColumns = () => {
  if (typeof window === 'undefined') {
    return 5
  }

  if (window.innerWidth < 640) {
    return 2
  }

  if (window.innerWidth < 1024) {
    return 3
  }

  return 5
}

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'main' | 'clock-style' | 'clock-city'>('main')
  const [pendingClockVariant, setPendingClockVariant] = useState<ClockVariant | null>(null)
  const [cityInput, setCityInput] = useState('')
  const [cityError, setCityError] = useState('')
  const [time, setTime] = useState(new Date())
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [draggedWidgetId, setDraggedWidgetId] = useState<number | null>(null)
  const [gridColumns, setGridColumns] = useState<number>(getGridColumns)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(new Date())
    }, 1000)

    const handleResize = () => {
      setGridColumns(getGridColumns())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const slotCount = gridColumns * 3

  const getNextAvailableSlot = (current: DashboardWidget[]) => {
    const usedSlots = new Set(current.map((widget) => widget.slot))

    for (let slot = 0; slot < slotCount; slot += 1) {
      if (!usedSlots.has(slot)) {
        return slot
      }
    }

    return 0
  }

  const moveWidgetToSlot = (targetSlot: number) => {
    if (draggedWidgetId === null) {
      return
    }

    setWidgets((current) => {
      const draggedWidget = current.find((widget) => widget.id === draggedWidgetId)

      if (!draggedWidget) {
        return current
      }

      const targetWidget = current.find((widget) => widget.slot === targetSlot && widget.id !== draggedWidgetId)

      return current.map((widget) => {
        if (widget.id === draggedWidgetId) {
          return { ...widget, slot: targetSlot }
        }

        if (targetWidget && widget.id === targetWidget.id) {
          return { ...widget, slot: draggedWidget.slot }
        }

        return widget
      })
    })

    setDraggedWidgetId(null)
  }

  const openModal = () => {
    setStep('main')
    setPendingClockVariant(null)
    setIsOpen(true)
  }

  const addClockWidget = (variant: ClockVariant, city: string, timeZone: string) => {
    setWidgets((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        kind: 'clock',
        variant,
        city,
        timeZone,
        slot: getNextAvailableSlot(current),
      },
    ])
    setPendingClockVariant(null)
    setCityInput('')
    setCityError('')
    setIsOpen(false)
  }

  const fetchCityTimeZone = async (city: string) => {
    if (!apiKey) {
      throw new Error('La clé API TIME_API_KEY est absente dans le fichier .env.')
    }

    const response = await fetch(`https://api.api-ninjas.com/v1/worldtime?city=${encodeURIComponent(city)}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Erreur lors de la récupération du fuseau horaire.')
    }

    const data = (await response.json()) as {
      city?: string
      timezone?: string
      timezone_name?: string
    }

    return {
      city: data.city || city,
      timeZone: data.timezone || data.timezone_name || 'UTC',
    }
  }

  const handleCitySubmit = async () => {
    if (!pendingClockVariant) {
      return
    }

    const trimmedCity = cityInput.trim()

    if (!trimmedCity) {
      setCityError('Saisis une ville pour continuer.')
      return
    }

    try {
      const { city, timeZone } = await fetchCityTimeZone(trimmedCity)
      addClockWidget(pendingClockVariant, city, timeZone)
    } catch (error) {
      setCityError(error instanceof Error ? error.message : 'Impossible de récupérer le fuseau horaire.')
    }
  }

  const addWeatherWidget = () => {
    setWidgets((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        kind: 'weather',
        city: 'Paris',
        slot: getNextAvailableSlot(current),
      },
    ])
    setIsOpen(false)
  }

  return (
    <div className="dashboard">
      <button
        type="button"
        className="add-widget-button"
        onClick={openModal}
        aria-label="Ajouter un widget"
      >
        +
      </button>

      {isOpen && (
        <div className="widget-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="widget-modal" onClick={(event) => event.stopPropagation()}>
            <div className="widget-modal__header">
              {step === 'main'
                ? 'Ajouter un widget'
                : step === 'clock-style'
                  ? 'Choisir un style d’horloge'
                  : 'Choisir une ville'}
            </div>

            {step === 'main' ? (
              <div className="widget-list">
                <button type="button" className="widget-option" onClick={() => setStep('clock-style')}>
                  Horloge
                </button>
                <button type="button" className="widget-option" onClick={addWeatherWidget}>
                  Météo
                </button>
              </div>
            ) : step === 'clock-style' ? (
              <div className="widget-list">
                {clockOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="widget-option"
                    onClick={() => {
                      setPendingClockVariant(option.value)
                      setStep('clock-city')
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="widget-list">
                <label className="widget-city-field">
                  <span>Ville</span>
                  <input
                    type="text"
                    className="widget-city-input"
                    value={cityInput}
                    onChange={(event) => {
                      setCityInput(event.target.value)
                      if (cityError) {
                        setCityError('')
                      }
                    }}
                    placeholder="Ex: London, Paris, Tokyo"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void handleCitySubmit()
                      }
                    }}
                  />
                </label>

                {cityError && <p className="widget-city-error">{cityError}</p>}

                <button type="button" className="widget-option" onClick={() => void handleCitySubmit()}>
                  Valider
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Widgets
        widgets={widgets}
        time={time}
        gridColumns={gridColumns}
        slotCount={slotCount}
        onMoveWidget={moveWidgetToSlot}
        draggedWidgetId={draggedWidgetId}
        onDragStart={setDraggedWidgetId}
        onDragEnd={() => setDraggedWidgetId(null)}
      />
    </div>
  )
}

export default App
