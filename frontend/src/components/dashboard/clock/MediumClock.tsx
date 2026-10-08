import { AnalogClock, cityClass, dateClass, layoutClass, type ClockLayoutProps } from './clockShared'

function MediumClock({ timezone, now, city, date }: ClockLayoutProps) {
  return (
    <div className={`${layoutClass} flex-col items-center gap-[4cqmin] text-center`}>
      <span className={`${cityClass} text-[9cqmin]`}>{city}</span>
      <AnalogClock date={now} timezone={timezone} className="aspect-square min-h-0 flex-1" />
      <span className={`${dateClass} text-[7cqmin]`}>{date}</span>
    </div>
  )
}

export default MediumClock
