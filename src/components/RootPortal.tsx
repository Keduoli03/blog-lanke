import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function RootPortal({ to, children }: { to?: HTMLElement; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const target = mounted ? (to ?? document.body) : null
  return target ? createPortal(children, target) : null
}
