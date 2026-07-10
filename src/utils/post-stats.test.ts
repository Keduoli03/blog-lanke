import { describe, expect, it } from 'vitest'
import { countPostWords, getPostStats } from './post-stats'

describe('post stats', () => {
  it('counts CJK characters and Latin words', () => {
    expect(countPostWords('中文 test')).toBe(3)
  })

  it('ignores fenced code and Markdown links', () => {
    expect(countPostWords('正文\n```ts\nconst hidden = 1\n```\n[链接](https://example.com)')).toBe(
      2,
    )
  })

  it('returns at least one reading minute for empty text', () => {
    expect(getPostStats('')).toEqual({ words: 0, readingMinutes: 1 })
  })
})
