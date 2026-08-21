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
})
