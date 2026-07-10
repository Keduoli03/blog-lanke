import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'

export function HoverDropdown({
  trigger,
  panel,
  containerClassName,
  panelClassName,
  closeDelay = 200,
}: {
  trigger: React.ReactNode
  panel: React.ReactNode
  containerClassName?: string
  panelClassName?: string
  closeDelay?: number
}) {
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
    timerRef.current = window.setTimeout(() => setOpen(false), closeDelay)
  }

  useEffect(() => () => clearTimer(), [])

  return (
    <div
      className={clsx('relative', containerClassName)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 8, scale: 0.96, x: '-50%' }}
            transition={{ duration: 0.18 }}
            className={clsx('absolute top-full left-1/2 mt-2 z-50 origin-top', panelClassName)}
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
