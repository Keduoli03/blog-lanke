import { useLayoutEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { getStoredPageScroll, pageScrollLocationAtom } from '@/store/scrollInfo'

export function ReadingProgress() {
  const [percent, setPercent] = useState(0)
  const scrollY = useAtomValue(pageScrollLocationAtom)

  useLayoutEffect(() => {
    let releaseFrame: number | null = null
    let settleFrame: number | null = null
    const $article = document.querySelector('#markdown-wrapper')
    if (!$article) return
    const root = document.documentElement
    const currentScrollY = root.hasAttribute('data-restored-reading-progress')
      ? window.scrollY || getStoredPageScroll()
      : scrollY

    const { offsetHeight, offsetTop } = $article as HTMLElement
    const fullHeight = offsetHeight + offsetTop - window.innerHeight
    const nextPercent =
      fullHeight <= 0
        ? 100
        : Math.max(0, Math.min(100, Math.floor((currentScrollY / fullHeight) * 100)))

    setPercent(nextPercent)

    if (root.hasAttribute('data-restored-reading-progress')) {
      releaseFrame = window.requestAnimationFrame(() => {
        settleFrame = window.requestAnimationFrame(() => {
          root.removeAttribute('data-restored-reading-progress')
        })
      })
    }

    return () => {
      if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame)
      if (settleFrame !== null) window.cancelAnimationFrame(settleFrame)
    }
  }, [scrollY])

  return (
    <div data-reading-progress>
      <span className="text-sm">
        {'\u8fdb\u5ea6 '}
        {percent}%
      </span>
    </div>
  )
}
