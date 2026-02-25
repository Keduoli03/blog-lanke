import { useEffect, useRef } from 'react'
import site from '@/config.json'

export function BangumiApp() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await import('bilibili-bangumi-component')
      } catch {}
      if (!mounted || !ref.current) return
      const tags = [
        'bilibili-bangumi',
        'bilibili-bangumi-component',
        'bangumi-component',
        'bili-bangumi',
      ]
      const tag =
        tags.find((t) => typeof window !== 'undefined' && !!customElements.get(t)) ??
        'bilibili-bangumi'
      const el = document.createElement(tag)
      const api = (site as any)?.bangumi?.api || ''
      const tabs = ((site as any)?.bangumi?.tabs || []).join(',')
      el.setAttribute('api', api)
      if (tabs) el.setAttribute('tabs', tabs)
      el.setAttribute('theme', 'auto')
      ref.current.innerHTML = ''
      ref.current.appendChild(el)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return <div ref={ref} />
}
