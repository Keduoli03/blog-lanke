import { describe, expect, it } from 'vitest'
import middleware from '../../middleware'

describe('Vercel routing middleware', () => {
  it('returns a real 308 for legacy article URLs', () => {
    const response = middleware(new Request('https://blog.blueke.top/posts/三道前端题/'))

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://blog.blueke.top/posts/722')
    expect(response.headers.get('vary')).toBe('Accept, Accept-Encoding')
  })

  it('rewrites the homepage as Markdown with an explicit content type', () => {
    const response = middleware(
      new Request('https://blog.blueke.top/', {
        headers: { Accept: 'text/markdown' },
      }),
    )

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://blog.blueke.top/llms.txt')
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('vary')).toBe('Accept, Accept-Encoding')
  })

  it('rewrites article requests before Vercel serves static HTML', () => {
    const response = middleware(
      new Request('https://blog.blueke.top/posts/astro-llms-txt', {
        headers: { Accept: 'text/markdown' },
      }),
    )

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://blog.blueke.top/posts/astro-llms-txt.md',
    )
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('vary')).toBe('Accept, Accept-Encoding')
  })

  it('continues ordinary HTML requests', () => {
    const response = middleware(
      new Request('https://blog.blueke.top/posts/astro-llms-txt', {
        headers: { Accept: 'text/html' },
      }),
    )

    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})
