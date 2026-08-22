import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('./PostCard.astro', import.meta.url)), 'utf8')

describe('PostCard source', () => {
  it('uses cached entry stats without rendering the post', () => {
    expect(source).not.toContain('render(entry)')
    expect(source).toContain('getPostStatsForEntry(entry)')
  })

  it('uses h3 titles beneath the post-list section heading', () => {
    expect(source).toContain('<h3 class="relative text-2xl font-bold">')
    expect(source).not.toContain('<h2 class="relative text-2xl font-bold">')
  })
})
