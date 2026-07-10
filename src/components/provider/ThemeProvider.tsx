import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { getLocalTheme, getSystemTheme, changePageTheme, setLocalTheme } from '@/utils/theme'
import { themeAtom } from '@/store/theme'

export function ThemeProvider() {
  const [theme, setTheme] = useAtom(themeAtom)
  const [initialized, setInitialized] = useState(false)

  function handlePrefersColorSchemeChange(event: MediaQueryListEvent) {
    if (theme === 'system') {
      changePageTheme(event.matches ? 'dark' : 'light')
    }
  }

  useEffect(() => {
    setTheme(getLocalTheme())
    setInitialized(true)
  }, [setTheme])

  useEffect(() => {
    if (!initialized) return
    setLocalTheme(theme)

    if (theme === 'system') {
      const systemTheme = getSystemTheme()
      changePageTheme(systemTheme)
    } else {
      changePageTheme(theme)
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', handlePrefersColorSchemeChange)

    return () => {
      query.removeEventListener('change', handlePrefersColorSchemeChange)
    }
  }, [initialized, theme])

  return null
}
