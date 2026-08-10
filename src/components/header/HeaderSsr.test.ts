import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './Header'
import { HeaderShell } from './HeaderShell'

describe('Header SSR', () => {
  it('renders navigation HTML without browser globals', () => {
    const html = renderToStaticMarkup(createElement(Header))
    const background = html.match(/<div data-header-background[^>]*>/)?.[0] ?? ''

    expect(html).toContain('<header')
    expect(html).toContain('<nav')
    expect(html).toContain('Site owner avatar')
    expect(background).toContain('bg-primary')
    expect(background).not.toContain('opacity')
  })

  it('isolates active navigation state between server renders', () => {
    const archive = renderToStaticMarkup(createElement(HeaderShell, { pathName: '/archives' }))
    const bangumi = renderToStaticMarkup(createElement(HeaderShell, { pathName: '/bangumi' }))

    expect(archive).toContain('text-accent" href="/archives"')
    expect(bangumi).toContain('text-accent" href="/bangumi"')
    expect(bangumi).not.toContain('py-1.5 text-accent" href="/archives"')
  })

  it('keeps article metadata isolated between server renders', () => {
    const first = renderToStaticMarkup(
      createElement(HeaderShell, {
        pathName: '/posts/first',
        title: 'First article',
        description: 'First category',
        slug: '/posts/first',
      }),
    )
    const second = renderToStaticMarkup(
      createElement(HeaderShell, {
        pathName: '/posts/second',
        title: 'Second article',
        description: 'Second category',
        slug: '/posts/second',
      }),
    )

    expect(first).toContain('First article')
    expect(second).toContain('Second article')
    expect(second).not.toContain('First article')
    expect(second).toContain('/posts/second')
  })
})
