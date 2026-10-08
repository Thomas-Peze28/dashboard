import { cityClass, dateClass, layoutClass, timeClass, type ClockLayoutProps } from './clockShared'

function SmallClock({ city, time, date }: ClockLayoutProps) {
  return (
    <div className={`${layoutClass} flex-col items-center justify-center gap-[7cqmin] text-center`}>
      <span className={`${cityClass} text-[12cqmin]`}>{city}</span>
      <time className={`${timeClass} text-[19cqmin]`}>{time}</time>
      <span className={`${dateClass} text-[9cqmin]`}>{date}</span>
    </div>
  )
}

export default SmallClock
