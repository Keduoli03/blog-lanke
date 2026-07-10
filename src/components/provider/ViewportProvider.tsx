import { useSetAtom } from 'jotai'
import { useLayoutEffect } from 'react'
import { isMobileAtom } from '@/store/viewport'

export function ViewportProvider() {
  const setIsMobile = useSetAtom(isMobileAtom)

  useLayoutEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')

    const syncViewport = (event?: MediaQueryListEvent) => {
      setIsMobile(!(event?.matches ?? query.matches))
    }

    syncViewport()
    query.addEventListener('change', syncViewport)
    return () => {
      query.removeEventListener('change', syncViewport)
    }
  }, [setIsMobile])

  return null
}
