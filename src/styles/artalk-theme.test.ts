import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8')

describe('Artalk theme bridge', () => {
  it('maps Artalk accent tokens to the site accent color', () => {
    const globalCss = read('styles/global.css')
    const artalkCss = read('styles/components/artalk.css')

    expect(globalCss).toContain("@import './components/artalk.css';")
    expect(artalkCss).toContain('html[data-theme] .artalk')
    expect(artalkCss).toContain('--at-color-main: rgb(var(--color-accent));')
    expect(artalkCss).toContain('--at-color-bg-light: rgb(var(--color-accent) / 0.1);')
    expect(artalkCss).toContain('--at-color-font: rgb(var(--color-text-primary));')
    expect(artalkCss).toContain('--at-color-border: rgb(var(--color-border-primary));')
    expect(artalkCss).toContain('--at-color-bg: rgb(var(--color-bg-primary));')
  })

  it('keeps the localized send button label in every Artalk loader', () => {
    for (const source of [
      read('components/comment/Artalk.tsx'),
      read('scripts/memos-runtime.ts'),
      read('pages/memos.astro'),
    ]) {
      expect(source).toContain("sendBtn: '发送'")
    }

    expect(read('styles/components/artalk.css')).toContain("content: '发送';")
  })

  it('keeps the moved inline editor inside an Artalk style scope', () => {
    expect(read('components/comment/InlineComments.tsx')).toContain(
      'className="artalk inline-comment-artalk-host"',
    )
  })

  it('provides a global article menu and keeps locator links in the current page', () => {
    const source = read('components/comment/InlineComments.tsx')
    const css = read('styles/components/inline-comments.css')

    expect(source).toContain("document.addEventListener('contextmenu'")
    expect(source).toContain('navigator.clipboard.writeText')
    expect(source).toContain("document.addEventListener('click', onLocatorClick, true)")
    expect(source).toContain('locateSelector(discussion.selector)')
    expect(source).not.toContain('💬')
    expect(css).toContain('.inline-comment-menu-item')
    expect(css).toContain('.inline-comment-located')
  })

  it('reuses Artalk comment nodes in a wider panel without showing the floating header menu', () => {
    const source = read('components/comment/InlineComments.tsx')
    const css = read('styles/components/inline-comments.css')

    expect(source).toContain('instance.ctx.list.getCommentNodes()')
    expect(source).toContain('className="artalk inline-comment-thread-artalk"')
    expect(css).toContain('width: min(38rem, 94vw);')
    expect(css).toContain('html.inline-comments-open [data-header-accessible-menu]')
    expect(css).toContain('html[data-theme] .inline-comment-thread-artalk .atk-content')
    expect(css).toContain('font-size: 0.875rem;')
    expect(css.match(/\.inline-comment-panel-header \{[\s\S]*?\}/)?.[0]).not.toContain(
      'border-bottom',
    )
    expect(css).not.toContain('.inline-comment-thread-item')
  })
})
