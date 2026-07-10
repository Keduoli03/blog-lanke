import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

describe('browser module sources', () => {
  it('loads Lightbox through an Astro-processed module script', () => {
    const source = readSource('../components/Lightbox.astro')

    expect(source).not.toContain('?url')
    expect(source).toContain("<script>\n  import '@/scripts/lightbox'\n</script>")
  })

  it('loads Livecodes through Vite only after finding a runner', () => {
    const source = readSource('../layouts/Layout.astro')
    const guardIndex = source.indexOf("document.querySelector('.livecodes-runner')")
    const importIndex = source.indexOf("import('@/scripts/livecodes')")

    expect(source).not.toContain('?url')
    expect(source).toContain('<script>')
    expect(guardIndex).toBeGreaterThan(-1)
    expect(importIndex).toBeGreaterThan(guardIndex)
  })

  it('bundles the iconify custom element instead of leaving a bare browser import', () => {
    const source = readSource('../layouts/Layout.astro')

    expect(source).not.toContain('<script is:inline type="module">')
    expect(source).toContain("<script>\n      import 'iconify-icon'\n    </script>")
  })
})
