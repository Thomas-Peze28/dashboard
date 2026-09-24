import { useEffect, useState } from 'react'
import './App.css'
import { Widgets, type ClockVariant, type DashboardWidget } from './components/Widgets'

const clockOptions = [
  { value: 'analog', label: 'Horloge ronde avec aiguilles' },
  { value: 'digital-square', label: 'Heure en chiffre dans un carré' },
  { value: 'digital-round', label: 'Heure en chiffre dans un rond' },
] as const

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'main' | 'clock'>('main')
  const [time, setTime] = useState(new Date())
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const openModal = () => {
    setStep('main')
    setIsOpen(true)
  }

  const addClockWidget = (variant: ClockVariant) => {
    setWidgets((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        kind: 'clock',
        variant,
      },
    ])
    setIsOpen(false)
  }

  const addWeatherWidget = () => {
    setWidgets((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        kind: 'weather',
        city: 'Paris',
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
              {step === 'main' ? 'Ajouter un widget' : 'Choisir un style d’horloge'}
            </div>

            {step === 'main' ? (
              <div className="widget-list">
                <button type="button" className="widget-option" onClick={() => setStep('clock')}>
                  Horloge
                </button>
                <button type="button" className="widget-option" onClick={addWeatherWidget}>
                  Météo
                </button>
              </div>
            ) : (
              <div className="widget-list">
                {clockOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="widget-option"
                    onClick={() => addClockWidget(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Widgets widgets={widgets} time={time} />
    </div>
  )
}

export default App
