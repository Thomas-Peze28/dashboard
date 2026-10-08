import { useEffect, useState } from 'react'
import { getTimezoneLabel } from '../../../constants/timezones'
import type { ClockLayoutProps } from './clockShared'
import LargeClock from './LargeClock'
import MediumClock from './MediumClock'
import SmallClock from './SmallClock'

type ClockContentProps = {
  timezone: string
  columns: number
  rows: number
}

function ClockContent({ timezone, columns, rows }: ClockContentProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const layoutProps: ClockLayoutProps = {
    timezone,
    now,
    city: getTimezoneLabel(timezone),
    time: new Intl.DateTimeFormat('fr-FR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(now),
    date: new Intl.DateTimeFormat('fr-FR', {
      timeZone: timezone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(now),
  }

  const Layout = columns > rows ? LargeClock : columns > 1 ? MediumClock : SmallClock

  return (
    <div className="absolute inset-0 overflow-hidden text-gray-900 [container-type:size]">
      <Layout {...layoutProps} />
    </div>
  )
}

export default ClockContent
