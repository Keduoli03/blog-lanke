import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { pathNameAtom, metaTitleAtom, metaDescriptionAtom, metaSlugAtom } from '@/store/metaInfo'

const DEV = import.meta.env.DEV

function normalizePath(value: string) {
  if (!value) return '/'
  if (value === '/') return value
  return value.replace(/\/+$/, '')
}

export function HeaderMetaInfoProvider({
  pathName,
  title = '',
  description = '',
  slug = '',
}: {
  pathName: string
  title?: string
  description?: string
  slug?: string
}) {
  const setPathName = useSetAtom(pathNameAtom)
  const setTitle = useSetAtom(metaTitleAtom)
  const setDescription = useSetAtom(metaDescriptionAtom)
  const setSlug = useSetAtom(metaSlugAtom)

  useEffect(() => {
    const normalized = normalizePath(pathName)
    if (DEV) console.log('[header:path:init-prop]', { pathName, normalized })
    setPathName(normalized)
    setTitle(title)
    setDescription(description)
    setSlug(slug)
  }, [pathName, title, description, slug, setDescription, setPathName, setSlug, setTitle])

  useEffect(() => {
    const syncRouteFromDocument = (source: string) => {
      const pathname = window.location.pathname
      const normalized = normalizePath(pathname)
      const main = document.querySelector<HTMLElement>('main[data-header-title]')
      if (DEV) console.log('[header:path:event]', { source, pathname, normalized })
      setPathName(normalized)
      if (main) {
        setTitle(main.dataset.headerTitle ?? '')
        setDescription(main.dataset.headerDescription ?? '')
        setSlug(main.dataset.headerSlug ?? '')
      }
    }

    const onPopstate = () => syncRouteFromDocument('popstate')
    const onAstroPageLoad = () => syncRouteFromDocument('astro:page-load')
    const onSwupReplace = () => syncRouteFromDocument('swup:content:replace')
    const onSwupReplaced = () => syncRouteFromDocument('swup:contentReplaced')

    syncRouteFromDocument('mount')
    window.addEventListener('popstate', onPopstate)
    document.addEventListener('astro:page-load', onAstroPageLoad)
    document.addEventListener('swup:content:replace', onSwupReplace)
    document.addEventListener('swup:contentReplaced', onSwupReplaced)

    return () => {
      window.removeEventListener('popstate', onPopstate)
      document.removeEventListener('astro:page-load', onAstroPageLoad)
      document.removeEventListener('swup:content:replace', onSwupReplace)
      document.removeEventListener('swup:contentReplaced', onSwupReplaced)
    }
  }, [setDescription, setPathName, setSlug, setTitle])

  return null
}
