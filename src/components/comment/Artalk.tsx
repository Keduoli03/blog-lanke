import { useEffect, useRef } from 'react'

export function Artalk({ server, site }: { server: string; site: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ensureCss = () => {
      if (!document.querySelector('link[href="https://unpkg.com/artalk@2.9.1/dist/Artalk.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/artalk@2.9.1/dist/Artalk.css'
        document.head.appendChild(link)
      }
    }
    const ensureJs = async () => {
      if ((window as any).Artalk) return (window as any).Artalk
      await new Promise<void>((resolve) => {
        const exist = document.getElementById('artalk-js')
        if (exist) {
          const check = () => {
            if ((window as any).Artalk) resolve()
            else setTimeout(check, 50)
          }
          check()
          return
        }
        const s = document.createElement('script')
        s.id = 'artalk-js'
        s.src = 'https://unpkg.com/artalk@2.9.1/dist/Artalk.js'
        s.async = true
        s.onload = () => resolve()
        document.head.appendChild(s)
      })
      return (window as any).Artalk
    }

    ensureCss()
    let instance: any
    let destroyed = false
    ;(async () => {
      const Artalk = await ensureJs()
      if (destroyed) return
      instance = Artalk.init({
        el: ref.current!,
        server,
        site,
        darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
      })
    })()

    const onTheme = () => {
      if (!instance) return
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      try {
        instance.setDarkMode(isDark)
      } catch {}
    }
    document.addEventListener('swup:content:replace', onTheme)

    return () => {
      destroyed = true
      try {
        instance?.destroy?.()
      } catch {}
      document.removeEventListener('swup:content:replace', onTheme)
    }
  }, [server, site])

  return <div ref={ref}></div>
}
