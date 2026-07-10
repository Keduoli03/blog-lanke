import { getPostStats, type PostStats } from './post-stats'

type PostEntry = object & { body?: string }

const entryStats = new WeakMap<object, PostStats>()

export function getPostStatsForEntry(entry: PostEntry): PostStats {
  const cached = entryStats.get(entry)
  if (cached) return cached

  const stats = getPostStats(entry.body ?? '')
  entryStats.set(entry, stats)
  return stats
}

export function sumPostWords(entries: PostEntry[]) {
  return entries.reduce((total, entry) => total + getPostStatsForEntry(entry).words, 0)
}
