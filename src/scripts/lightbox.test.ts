// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Lightbox } from './lightbox'

describe('Lightbox.init', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('binds global events only once', () => {
    const documentListenerSpy = vi.spyOn(document, 'addEventListener')
    const windowListenerSpy = vi.spyOn(window, 'addEventListener')
    const lightbox = new Lightbox()
    const documentCallsAfterConstruction = documentListenerSpy.mock.calls.length
    const windowCallsAfterConstruction = windowListenerSpy.mock.calls.length

    lightbox.init()

    expect(documentListenerSpy).toHaveBeenCalledTimes(documentCallsAfterConstruction)
    expect(windowListenerSpy).toHaveBeenCalledTimes(windowCallsAfterConstruction)
  })
})
