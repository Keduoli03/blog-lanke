// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  Reflect.deleteProperty(window, 'UserConfig')
})

test('local public assets resolve against the blog rather than the API', async () => {
  const { resolveAvatarUrl } = await import('./cycle.js')
  const expected = 'https://blueke.top/images/friends/081fe612c98ff538.webp'
  for (const path of [
    '/images/friends/081fe612c98ff538.webp',
    'public/images/friends/081fe612c98ff538.webp',
    '/public/images/friends/081fe612c98ff538.webp',
  ]) {
    expect(resolveAvatarUrl(path, 'https://blueke.top/')).toBe(expected)
  }
  expect(resolveAvatarUrl('https://example.com/avatar.png', 'https://blueke.top/')).toBe(
    'https://example.com/avatar.png',
  )
  expect(resolveAvatarUrl('javascript:alert(1)', 'https://blueke.top/')).toBe('')
  expect(resolveAvatarUrl('', 'https://blueke.top/')).toBe('')
})

test('the current local friend avatar replaces an old API avatar', async () => {
  const { initFriendCircle } = await import('./cycle.js')
  Object.assign(window, {
    UserConfig: { friend_avatars: { 'https://example.com': '/images/friends/local.webp' } },
  })
  document.body.innerHTML = '<div><div id="friend-circle-lite-root"></div></div>'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: async () => ({
        article_data: [
          {
            author: 'Alice',
            title: 'Post',
            link: 'https://example.com/post/',
            avatar: 'https://broken.example/avatar.png',
            created: '2026-10-27',
          },
        ],
      }),
    }),
  )
  initFriendCircle()
  await vi.waitFor(() => expect(document.querySelectorAll('.card')).toHaveLength(1))
  for (const image of document.querySelectorAll<HTMLImageElement>('.card img')) {
    expect(image.src).toBe(window.location.origin + '/images/friends/local.webp')
  }
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
