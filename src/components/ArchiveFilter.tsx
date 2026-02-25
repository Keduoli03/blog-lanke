import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import '@/icons/registerRi'

type Props = {
  categories: string[]
  tags: string[]
  years: number[]
}

export default function ArchiveFilter({ categories, tags, years }: Props) {
  const [category, setCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (selectedTags.length) params.set('tags', selectedTags.join(','))
    if (year) params.set('year', String(year))
    const url = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    history.replaceState(null, '', url)
    // localStorage.setItem('archivesFilter', JSON.stringify({ category, tags: selectedTags, year }))
    filterTimeline(category, selectedTags, year)
  }, [category, selectedTags, year])

  const sortedCategories = useMemo(() => [...new Set(categories)].sort(), [categories])
  const sortedTags = useMemo(() => [...new Set(tags)].sort(), [tags])
  const sortedYears = useMemo(() => [...new Set(years)].sort((a, b) => b - a), [years])

  function toggleCategory(c: string) {
    setCategory((prev) => (prev === c ? null : c))
  }
  function toggleTag(t: string) {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }
  function toggleYear(y: number) {
    setYear((prev) => (prev === y ? null : y))
  }
  function clearAll() {
    setCategory(null)
    setSelectedTags([])
    setYear(null)
  }

  return (
    <div className="rounded-xl bg-white/60 dark:bg-zinc-800/50 p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 font-bold">
          <Icon icon="ri:folder-2-line" />
          <span>分类</span>
        </div>
        <button className="text-secondary hover:text-accent" onClick={clearAll} title="清空筛选">
          <Icon icon="ri:restart-line" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map((c) => (
          <button
            key={c}
            onClick={() => toggleCategory(c)}
            className={`px-2 py-0.5 rounded-md border ${
              category === c
                ? 'bg-accent/10 border-accent text-accent'
                : 'border-primary hover:border-accent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="inline-flex items-center gap-2 font-bold mt-2">
        <Icon icon="ri:price-tag-3-line" />
        <span>标签</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((t) => {
          const active = selectedTags.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`px-2 py-0.5 rounded-md border ${
                active
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-primary hover:border-accent'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>
      <div className="inline-flex items-center gap-2 font-bold mt-2">
        <Icon icon="ri:calendar-2-line" />
        <span>年份</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedYears.map((y) => (
          <button
            key={y}
            onClick={() => toggleYear(y)}
            className={`px-2 py-0.5 rounded-md border ${
              year === y
                ? 'bg-accent/10 border-accent text-accent'
                : 'border-primary hover:border-accent'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}

function filterTimeline(category: string | null, tags: string[], year: number | null) {
  const container = document.getElementById('archives-timeline')
  if (!container) return
  const items = Array.from(container.querySelectorAll<HTMLLIElement>('li[data-category]'))
  for (const li of items) {
    const itemCategory = li.dataset.category || ''
    const itemTags = (li.dataset.tags || '').split(',').filter(Boolean)
    const group = li.closest<HTMLElement>('[data-year]')
    const itemYear = group ? Number(group.dataset.year) : NaN
    const matchCategory = category ? itemCategory === category : true
    const matchTags = tags.length ? tags.every((t) => itemTags.includes(t)) : true
    const matchYear = year ? itemYear === year : true
    li.style.display = matchCategory && matchTags && matchYear ? '' : 'none'
  }
  const groups = Array.from(container.querySelectorAll<HTMLElement>('[data-year]'))
  for (const group of groups) {
    const lis = Array.from(group.querySelectorAll<HTMLLIElement>('li[data-category]'))
    const anyVisible = lis.some((li) => li.style.display !== 'none')
    group.style.display = anyVisible ? '' : 'none'
  }
}
