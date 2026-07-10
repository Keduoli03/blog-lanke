import { describe, expect, it, vi } from 'vitest'

describe('theme atom SSR', () => {
  it('can be imported without browser storage globals', async () => {
    vi.resetModules()

    await expect(import('./theme')).resolves.toHaveProperty('themeAtom')
  })
})
