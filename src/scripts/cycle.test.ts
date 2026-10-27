// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

test('avatar failures use a local, author-specific placeholder', async () => {
  const { createAvatarFallback, initFriendCircle } = await import('./cycle.js')
  const first = createAvatarFallback('Alice')
  expect(first).toBe(createAvatarFallback('Alice'))
  expect(first).not.toBe(createAvatarFallback('Bob'))
  expect(decodeURIComponent(createAvatarFallback('<'))).not.toContain('><</text>')

  document.body.innerHTML = '<div><div id="friend-circle-lite-root"></div></div>'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: async () => ({
        article_data: [
          {
            author: 'Alice',
            title: 'Post',
            link: 'https://example.com/1',
            avatar: '',
            created: '2026-10-26',
          },
          {
            author: 'Bob',
            title: 'Post',
            link: 'https://example.com/2',
            avatar: 'https://example.com/avatar.png',
            created: '2026-10-25',
          },
        ],
      }),
    }),
  )
  initFriendCircle()
  await vi.waitFor(() => expect(document.querySelectorAll('.card')).toHaveLength(2))
  const images = document.querySelectorAll<HTMLImageElement>('.card-author img')
  expect(images[0].src).toBe(first)
  expect(images[1].src).toBe('https://example.com/avatar.png')
  expect(images[1].dataset.fallback).not.toBe(first)
  expect(images[1].getAttribute('referrerpolicy')).toBe('no-referrer')
  expect(images[1].getAttribute('onerror')).toContain('this.onerror=null')
  expect(document.body.innerHTML).not.toContain('Friend-Circle-Frontend/logo.png')
})
