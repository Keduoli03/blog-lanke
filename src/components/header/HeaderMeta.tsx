import { site } from '@/config.json'
import { useHeaderMetaInfo, useShouldHeaderMetaShow } from './hooks'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

export function HeaderMeta({
  title: initialTitle = '',
  description: initialDescription = '',
  slug: initialSlug = '',
}: {
  title?: string
  description?: string
  slug?: string
}) {
  const liveMetaInfo = useHeaderMetaInfo()
  const shouldShow = useShouldHeaderMetaShow()
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  const { title, description, slug } = hasHydrated
    ? liveMetaInfo
    : {
        title: initialTitle,
        description: initialDescription,
        slug: initialSlug,
      }

  return (
    <div
      data-header-meta
      className={clsx(
        'absolute inset-0 z-10 flex items-center justify-between px-4 pointer-events-none md:px-4 motion-reduce:transition-none motion-reduce:transform-none',
        shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
      )}
      aria-hidden={!shouldShow}
      inert={!shouldShow}
    >
      <div className="grow min-w-0 pl-0 pr-24 md:pl-20 md:pr-0 pointer-events-none">
        <div className="text-secondary text-xs truncate">{description}</div>
        <p className="truncate text-sm md:text-lg">{title}</p>
      </div>
      <div className="hidden md:block min-w-0 text-right pr-20 md:pr-28 pointer-events-none max-w-[50%]">
        <div className="text-secondary text-xs truncate">{slug}</div>
        <div>{site.title}</div>
      </div>
    </div>
  )
}
