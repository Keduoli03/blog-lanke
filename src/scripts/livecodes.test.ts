// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const { createPlayground } = vi.hoisted(() => ({
  createPlayground: vi.fn(),
}))

vi.mock('livecodes', () => ({ createPlayground }))

import { initLivecodes } from './livecodes'

function renderRunner() {
  document.body.innerHTML = `
    <div class="livecodes-runner">
      <div class="livecodes-runner__mount"></div>
      <script class="livecodes-runner__data" type="application/json">
        {"template":"vanilla","code":"console.log('ready')"}
      </script>
    </div>
  `
  return document.querySelector<HTMLElement>('.livecodes-runner')!
}

describe('initLivecodes', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    createPlayground.mockReset()
    vi.restoreAllMocks()
  })

  it('clears a failed initialization so a later page load can retry', async () => {
    const runner = renderRunner()
    const error = new Error('LiveCodes failed')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    createPlayground.mockRejectedValueOnce(error).mockResolvedValueOnce({ destroy: vi.fn() })

    await expect(initLivecodes()).resolves.toBeUndefined()

    expect(runner.hasAttribute('data-lc-init')).toBe(false)
    expect(runner.hasAttribute('data-lc-initializing')).toBe(false)

    await expect(initLivecodes()).resolves.toBeUndefined()

    expect(createPlayground).toHaveBeenCalledTimes(2)
    expect(runner.getAttribute('data-lc-init')).toBe('1')
    expect(runner.hasAttribute('data-lc-initializing')).toBe(false)
  })

  it('keeps a connected successful instance across repeated initialization', async () => {
    const runner = renderRunner()
    const destroy = vi.fn()
    createPlayground.mockResolvedValue({ destroy })

    await initLivecodes()
    await initLivecodes()

    expect(createPlayground).toHaveBeenCalledOnce()
    expect(destroy).not.toHaveBeenCalled()
    expect(runner.getAttribute('data-lc-init')).toBe('1')
  })
})
