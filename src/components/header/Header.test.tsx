// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { useReducedMotion } from 'framer-motion'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Header } from './Header'
import { HeaderMotionConfig } from './HeaderShell'

const headerContentSource = readFileSync(
  resolve(process.cwd(), 'src/components/header/HeaderContent.tsx'),
  'utf8',
)

describe('Header reduced motion', () => {
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
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the logo and primary navigation without animation callbacks', () => {
    const { container } = render(<Header />)

    expect(screen.getByRole('img', { name: 'Site owner avatar' })).toBeTruthy()
    expect(screen.getByRole('navigation')).toBeTruthy()
    expect(container.innerHTML).toContain('hidden md:flex')
    expect(container.innerHTML).toContain('md:hidden')
    expect(container.innerHTML).toContain('pointer-events-none')
    expect(container.innerHTML).toContain('pointer-events-auto')
  })

  it('propagates the user reduced-motion preference to retained motion components', () => {
    function MotionPreferenceProbe() {
      return <span>{useReducedMotion() ? 'reduced' : 'animated'}</span>
    }

    render(
      <HeaderMotionConfig>
        <MotionPreferenceProbe />
      </HeaderMotionConfig>,
    )

    expect(screen.getByText('reduced')).toBeTruthy()
  })

  it('only animates the active menu icon after the initial hydration', () => {
    expect(headerContentSource).toMatch(
      /initial=\{hasMounted\.current \? \{ y: 8, opacity: 0, scale: 0\.92 \} : false\}/,
    )
  })
})
