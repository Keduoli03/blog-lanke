import type { MarkdownHeading } from 'astro'
import clsx from 'clsx'
import { startTransition, useEffect, useRef, useState } from 'react'

function useActiveItem() {
  const [activeItem, setActiveItem] = useState('')

  useEffect(() => {
    let headingOffsets: Array<{ id: string; offset: number }> = []
    let frameId: number | null = null
    let shouldMeasure = true

    const updateActiveItem = (currentScrollY: number) => {
      const readingPosition = currentScrollY + 80
      let low = 0
      let high = headingOffsets.length - 1
      let activeIndex = -1

      while (low <= high) {
        const middle = Math.floor((low + high) / 2)
        if (headingOffsets[middle].offset <= readingPosition) {
          activeIndex = middle
          low = middle + 1
        } else {
          high = middle - 1
        }
      }

      const nextActiveItem = activeIndex >= 0 ? headingOffsets[activeIndex].id : ''
      startTransition(() => {
        setActiveItem((current) => (current === nextActiveItem ? current : nextActiveItem))
      })
    }

    const runFrame = () => {
      frameId = null
      const currentScrollY = window.scrollY

      if (shouldMeasure) {
        shouldMeasure = false
        const $article = document.querySelector('#markdown-wrapper')
        const $headings = $article
          ? Array.from($article.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'))
          : []
        headingOffsets = $headings
          .map((heading) => ({
            id: heading.id,
            offset: heading.getBoundingClientRect().top + currentScrollY,
          }))
          .sort((a, b) => a.offset - b.offset)
      }

      updateActiveItem(currentScrollY)
    }

    const scheduleFrame = (remeasure = false) => {
      shouldMeasure ||= remeasure
      if (frameId !== null) return
      frameId = requestAnimationFrame(runFrame)
    }

    const scheduleMeasure = () => scheduleFrame(true)
    const scheduleScrollUpdate = () => scheduleFrame()

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true })
    window.addEventListener('resize', scheduleMeasure)
    document.addEventListener('astro:page-load', scheduleMeasure)
    document.addEventListener('swup:contentReplaced', scheduleMeasure)
    scheduleMeasure()

    return () => {
      window.removeEventListener('scroll', scheduleScrollUpdate)
      window.removeEventListener('resize', scheduleMeasure)
      document.removeEventListener('astro:page-load', scheduleMeasure)
      document.removeEventListener('swup:contentReplaced', scheduleMeasure)
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [])

  return activeItem
}

export function PostToc({ headings }: { headings: MarkdownHeading[] }) {
  const activeItem = useActiveItem()

  return (
    <ul
      className="relative overflow-y-auto space-y-2 group text-sm"
      style={{
        maxHeight: 'min(380px, calc(100vh - 250px))',
        scrollbarWidth: 'none',
      }}
    >
      {headings.map((item) => (
        <TocItem
          key={item.slug}
          slug={item.slug}
          text={item.text}
          depth={item.depth}
          isActive={item.slug === activeItem}
        />
      ))}
    </ul>
  )
}

export function TocItem({
  slug,
  text,
  depth,
  isActive,
}: {
  slug: string
  text: string
  depth: number
  isActive: boolean
}) {
  const itemRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!isActive) return
    const $item = itemRef.current
    if (!$item) return
    const $container = $item.parentElement
    if (!$container) return

    const containerHeight = $container.clientHeight
    const itemHeight = $item.clientHeight
    const itemOffsetTop = $item.offsetTop
    const scrollTop = $container.scrollTop

    const itemTop = itemOffsetTop - scrollTop
    const itemBottom = itemTop + itemHeight

    if (itemTop < 0) {
      $container.scrollTop = itemOffsetTop
    } else if (itemBottom > containerHeight) {
      $container.scrollTop = itemOffsetTop - containerHeight + itemHeight
    }
  }, [isActive])

  return (
    <li className="relative" ref={itemRef}>
      <span
        className={clsx(
          'absolute left-0 top-2 h-1 rounded-full',
          isActive ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
        style={{ width: `${4 * (7 - depth)}px` }}
      ></span>
      <a
        className={clsx(
          'inline-block pl-8 opacity-60 transition-opacity duration-300 focus-visible:opacity-100',
          isActive
            ? 'opacity-100'
            : 'group-hover:opacity-100 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
        )}
        href={`#${slug}`}
        aria-current={isActive ? 'location' : undefined}
      >
        <span>{text}</span>
      </a>
    </li>
  )
}
