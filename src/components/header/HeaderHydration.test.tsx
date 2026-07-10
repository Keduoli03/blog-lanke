// @vitest-environment jsdom
import { act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderShell } from './HeaderShell'

describe('HeaderShell hydration', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)),
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => window.clearTimeout(id)),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('hydrates the server tree before viewport providers update shared atoms', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    container.innerHTML = renderToString(<HeaderShell pathName="/archives" />)
    document.body.append(container)

    let root: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, <HeaderShell pathName="/archives" />)
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    expect(container.querySelector('header')).toBeTruthy()
    expect(container.querySelector('img[alt="Site owner avatar"]')).toBeTruthy()
    expect(
      consoleError.mock.calls.filter(([message]) =>
        /hydration|did not match|server rendered html/i.test(String(message)),
      ),
    ).toEqual([])

    await act(async () => root!.unmount())
    consoleError.mockRestore()
  })
})
