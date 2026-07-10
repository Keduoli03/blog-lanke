// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PostToc } from './PostToc'

let scrollY = 0
let nextFrameId = 1
const frames = new Map<number, FrameRequestCallback>()
const requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) => {
  const id = nextFrameId++
  frames.set(id, callback)
  return id
})
const cancelAnimationFrameMock = vi.fn((id: number) => {
  frames.delete(id)
})

function flushFrame() {
  const pending = [...frames.entries()]
  frames.clear()
  pending.forEach(([, callback]) => callback(performance.now()))
}

function setHeadingOffset(id: string, offset: number) {
  const heading = document.getElementById(id)!
  vi.spyOn(heading, 'getBoundingClientRect').mockImplementation(
    () => ({ top: offset - scrollY }) as DOMRect,
  )
}

function renderToc() {
  return render(
    <PostToc
      headings={[
        { depth: 2, slug: 'first', text: 'First' },
        { depth: 2, slug: 'second', text: 'Second' },
        { depth: 2, slug: 'third', text: 'Third' },
      ]}
    />,
  )
}

function current(name: string) {
  return screen.getByRole('link', { name }).getAttribute('aria-current')
}

function scrollTo(nextScrollY: number) {
  scrollY = nextScrollY
  window.dispatchEvent(new Event('scroll'))
  act(flushFrame)
}

describe('PostToc', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<article id="markdown-wrapper"><h2 id="first">First</h2><h2 id="second">Second</h2><h2 id="third">Third</h2></article>'
    scrollY = 0
    nextFrameId = 1
    frames.clear()
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY)
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrameMock)
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock)
    setHeadingOffset('first', 200)
    setHeadingOffset('second', 600)
    setHeadingOffset('third', 1200)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    requestAnimationFrameMock.mockClear()
    cancelAnimationFrameMock.mockClear()
    frames.clear()
  })

  it('selects cached offsets across initial, downward, long-section, and upward positions', () => {
    renderToc()
    act(flushFrame)

    const firstRect = document.getElementById('first')!.getBoundingClientRect
    const secondRect = document.getElementById('second')!.getBoundingClientRect
    expect(current('First')).toBeNull()
    expect(current('Second')).toBeNull()

    scrollTo(120)
    expect(current('First')).toBe('location')

    scrollTo(400)
    expect(current('First')).toBe('location')

    scrollTo(520)
    expect(current('Second')).toBe('location')

    scrollTo(500)
    expect(current('First')).toBe('location')
    expect(firstRect).toHaveBeenCalledOnce()
    expect(secondRect).toHaveBeenCalledOnce()
  })

  it('coalesces multiple scroll events into one animation frame', () => {
    renderToc()
    act(flushFrame)
    requestAnimationFrameMock.mockClear()

    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))

    expect(requestAnimationFrameMock).toHaveBeenCalledOnce()
  })

  it('remeasures cached offsets after resize and Astro or Swup content replacement', () => {
    renderToc()
    act(flushFrame)
    scrollTo(520)
    expect(current('Second')).toBe('location')

    setHeadingOffset('second', 900)
    window.dispatchEvent(new Event('resize'))
    act(flushFrame)
    expect(current('First')).toBe('location')

    setHeadingOffset('second', 580)
    document.dispatchEvent(new Event('astro:page-load'))
    act(flushFrame)
    expect(current('Second')).toBe('location')

    document.querySelector('#markdown-wrapper')!.innerHTML =
      '<h2 id="first">First</h2><h2 id="second">Second</h2><h2 id="third">Third</h2>'
    setHeadingOffset('first', 200)
    setHeadingOffset('second', 900)
    setHeadingOffset('third', 1200)
    document.dispatchEvent(new Event('swup:contentReplaced'))
    act(flushFrame)
    expect(current('First')).toBe('location')
  })

  it('removes listeners and cancels a pending frame on cleanup', () => {
    const view = renderToc()
    act(flushFrame)
    requestAnimationFrameMock.mockClear()

    window.dispatchEvent(new Event('scroll'))
    expect(requestAnimationFrameMock).toHaveBeenCalledOnce()
    const pendingFrame = requestAnimationFrameMock.mock.results[0].value

    view.unmount()
    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(pendingFrame)

    requestAnimationFrameMock.mockClear()
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    document.dispatchEvent(new Event('astro:page-load'))
    document.dispatchEvent(new Event('swup:contentReplaced'))
    expect(requestAnimationFrameMock).not.toHaveBeenCalled()
  })
})
