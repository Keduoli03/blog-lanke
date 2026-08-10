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
    // Both providers initialize their atoms in layout effects. Release the
    // pre-paint guard atomically after that work has committed; removing the
    // scroll override one frame before marking the header ready exposes the
    // server-rendered capsule for a frame.
    const readyFrame = window.requestAnimationFrame(() => {
      const root = document.documentElement
      root.removeAttribute('data-restored-scroll')
      root.setAttribute('data-header-ready', '')
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
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [setScrollDirection, setScrollLocation])

  return null
}
