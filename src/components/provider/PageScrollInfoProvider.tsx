import { useLayoutEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import {
  pageScrollLocationAtom,
  pageScrollDirectionAtom,
  getStoredPageScroll,
  storePageScroll,
} from '@/store/scrollInfo'

export function PageScrollInfoProvider() {
  const setScrollLocation = useSetAtom(pageScrollLocationAtom)
  const setScrollDirection = useSetAtom(pageScrollDirectionAtom)
  const prevScrollY = useRef(0)
  const frameRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const updateScrollInfo = (isInitial = false) => {
      frameRef.current = null
      let currentTop = document.documentElement.scrollTop

      if (currentTop === 0) {
        const bodyStyle = document.body.style
        if (bodyStyle.position === 'fixed') {
          const bodyTop = bodyStyle.top
          currentTop = Math.abs(parseInt(bodyTop, 10))
        }
      }

      if (isInitial && currentTop === 0) {
        currentTop = getStoredPageScroll()
      }

      if (!isInitial) {
        setScrollDirection(prevScrollY.current - currentTop > 0 ? 'up' : 'down')
      }
      prevScrollY.current = currentTop
      setScrollLocation(currentTop)
      storePageScroll(currentTop)
    }

    const scrollHandler = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(() => updateScrollInfo())
    }

    updateScrollInfo(true)
    // Swup can replace the page after the browser has already restored scroll.
    // Synchronize from the actual document position so the header does not keep
    // the previous article's "scrolled" state on the next route.
    const syncNavigationScroll = () => updateScrollInfo()
    document.addEventListener('astro:page-load', syncNavigationScroll)
    document.addEventListener('swup:contentReplaced', syncNavigationScroll)
    let releaseFrame: number | null = null
    // Drop the pre-paint overrides first, then re-enable transitions a frame later.
    // The reverse order lets the hand-off animate for one frame, which is the flash.
    const readyFrame = window.requestAnimationFrame(() => {
      document.documentElement.removeAttribute('data-restored-scroll')
      releaseFrame = window.requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-header-ready', '')
      })
    })
    const persistScroll = () => storePageScroll(document.documentElement.scrollTop)
    window.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('pagehide', persistScroll)
    return () => {
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('pagehide', persistScroll)
      document.removeEventListener('astro:page-load', syncNavigationScroll)
      document.removeEventListener('swup:contentReplaced', syncNavigationScroll)
      window.cancelAnimationFrame(readyFrame)
      if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [setScrollDirection, setScrollLocation])

  return null
}
