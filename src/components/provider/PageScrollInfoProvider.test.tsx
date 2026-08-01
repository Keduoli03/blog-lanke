// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageScrollInfoProvider } from './PageScrollInfoProvider'

describe('PageScrollInfoProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('coalesces scroll updates into one passive animation frame and cancels pending work', () => {
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 42)
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const addEventListener = vi.spyOn(window, 'addEventListener')

    const view = render(<PageScrollInfoProvider />)
    const initialFrameCount = requestFrame.mock.calls.length
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))

    expect(requestFrame).toHaveBeenCalledTimes(initialFrameCount + 1)
    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    })

    view.unmount()
    expect(cancelFrame).toHaveBeenCalledWith(42)
  })
})
