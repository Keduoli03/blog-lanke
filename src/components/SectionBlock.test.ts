import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('./SectionBlock.astro', import.meta.url)), 'utf8')

describe('SectionBlock source', () => {
  it('exposes its title as a section heading', () => {
    expect(source).toContain('<h2 class="mb-8 font-bold uppercase tracking-widest text-accent">')
  })
})
