import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './Header'

describe('Header SSR', () => {
  it('renders navigation HTML without browser globals', () => {
    const html = renderToStaticMarkup(createElement(Header))

    expect(html).toContain('<header')
    expect(html).toContain('<nav')
    expect(html).toContain('Site owner avatar')
  })
})
