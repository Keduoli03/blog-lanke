import { useLayoutEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { pageScrollLocationAtom, pageScrollDirectionAtom } from '@/store/scrollInfo'

export function PageScrollInfoProvider() {
  const setScrollLocation = useSetAtom(pageScrollLocationAtom)
  const setScrollDirection = useSetAtom(pageScrollDirectionAtom)
  const prevScrollY = useRef(0)
  const frameRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const updateScrollInfo = () => {
      frameRef.current = null
      let currentTop = document.documentElement.scrollTop

      if (currentTop === 0) {
        const bodyStyle = document.body.style
        if (bodyStyle.position === 'fixed') {
          const bodyTop = bodyStyle.top
          currentTop = Math.abs(parseInt(bodyTop, 10))
        }
      }

      setScrollDirection(prevScrollY.current - currentTop > 0 ? 'up' : 'down')
      prevScrollY.current = currentTop
      setScrollLocation(currentTop)
    }

    const scrollHandler = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(updateScrollInfo)
    }

    scrollHandler()
    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => {
      window.removeEventListener('scroll', scrollHandler)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [setScrollDirection, setScrollLocation])

  return null
}
