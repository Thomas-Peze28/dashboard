import { AnalogClock, cityClass, dateClass, layoutClass, timeClass, type ClockLayoutProps } from './clockShared'

function LargeClock({ timezone, now, city, time, date }: ClockLayoutProps) {
  return (
    <div className={`${layoutClass} items-center gap-[6cqmin]`}>
      <AnalogClock date={now} timezone={timezone} className="h-[66cqmin] w-[66cqmin] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col items-center gap-[5cqmin] text-center">
        <span className={`${cityClass} text-[9cqmin]`}>{city}</span>
        <time className={`${timeClass} text-[14cqmin]`}>{time}</time>
        <span className={`${dateClass} text-[7cqmin]`}>{date}</span>
      </div>
    </div>
  )
}

export default LargeClock
