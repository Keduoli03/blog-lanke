import { useEffect, useRef, useState } from 'react'
import ColumnQuickMenu from './ColumnQuickMenu'

export default function ColumnHover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleEnter = () => {
    clearTimer()
    setOpen(true)
  }
  const handleLeave = () => {
    clearTimer()
    timerRef.current = window.setTimeout(() => setOpen(false), 200)
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <ColumnQuickMenu open={open} />
    </div>
  )
}
