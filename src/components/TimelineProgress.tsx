import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { getDaysInYear, getDiffInDays, getStartOfDay, getStartOfYear } from '@/utils/date'

export function TimelineProgress() {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [dayOfYear, setDayOfYear] = useState(() =>
    getDiffInDays(getStartOfYear(new Date()), new Date()),
  )
  const [percentOfYear, setPercentOfYear] = useState(
    () => (dayOfYear / getDaysInYear(new Date())) * 100,
  )
  const [percentOfToday, setPercentOfToday] = useState(
    () => ((new Date().getTime() - getStartOfDay(new Date()).getTime()) / 86400 / 1000) * 100,
  )

  const updateInfo = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())

    const pastDays = getDiffInDays(getStartOfYear(now), now)
    setDayOfYear(pastDays)
    setPercentOfYear((pastDays / getDaysInYear(now)) * 100)

    const pastTime = now.getTime() - getStartOfDay(now).getTime()
    setPercentOfToday((pastTime / 86400 / 1000) * 100)
  }

  useEffect(() => {
    updateInfo()
    const interval = setInterval(updateInfo, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      <p className="mt-4">
        今天是 {currentYear} 年的第 <CountUp to={dayOfYear} decimals={0} /> 天
      </p>
      <p className="mt-4">
        今年已过 <CountUp to={percentOfYear} decimals={5} />%
      </p>
      <p className="mt-4">
        今天已过 <CountUp to={percentOfToday} decimals={5} />%
      </p>
    </>
  )
}

function CountUp({
  to,
  decimals,
  duration = 1,
}: {
  to: number
  decimals: number
  duration?: number
}) {
  const node = useRef<HTMLSpanElement>(null)
  const prev = useRef(to)

  useEffect(() => {
    if (!node.current) return
    if (prev.current === to) return

    const control = animate(prev.current, to, {
      duration,
      onUpdate: (value) => {
        if (!node.current) return
        node.current.textContent = value.toFixed(decimals)
      },
    })
    prev.current = to

    return () => {
      control.stop()
    }
  }, [to, decimals, duration])

  return (
    <span ref={node} suppressHydrationWarning>
      {to.toFixed(decimals)}
    </span>
  )
}
