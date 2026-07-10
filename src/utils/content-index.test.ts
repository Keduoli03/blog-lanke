import { describe, expect, it } from 'vitest'
import { getPostStatsForEntry, sumPostWords } from './content-index'

describe('content stats index', () => {
  it('sums entry word counts', () => {
    const entries = [{ body: '中文 test' }, { body: 'two words' }]
    expect(sumPostWords(entries)).toBe(5)
  })

  it('reuses the stats object for the same entry', () => {
    const entry = { body: 'cached words' }
    expect(getPostStatsForEntry(entry)).toBe(getPostStatsForEntry(entry))
  })
})
