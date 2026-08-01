import { useEffect, useMemo, useState } from 'react'
import type { IconifyIcon } from '@iconify/types'
import { riCalendar2Line, riFolder2Line, riPriceTag3Line, riRestartLine } from '@/icons/ri'
import { StaticIcon } from '@/components/header/StaticIcon'

type Props = {
  categories: string[]
  tags: string[]
  years: number[]
  initialCategory?: string | null
  initialTags?: string[]
  initialYear?: number | null
}

const chipBase =
  'px-2.5 py-1 rounded-md text-[13px] leading-5 select-none transition-all duration-200'
const chipOff =
  'bg-black/[0.04] dark:bg-white/[0.06] text-secondary hover:bg-accent/10 hover:text-accent'
const chipOn = 'bg-accent text-white shadow-sm shadow-accent/40'

function SectionTitle({ icon, children }: { icon: IconifyIcon; children: string }) {
  return (
    <div className="inline-flex items-center gap-2 font-bold">
      <StaticIcon icon={icon} className="size-5 text-accent" />
      <span className="relative">
        <span className="absolute -z-1 top-[30%] left-0 w-full h-[40%] bg-accent/30 -rotate-3" />
        {children}
      </span>
    </div>
  )
}

export default function ArchiveFilter({
  categories,
  tags,
  years,
  initialCategory = null,
  initialTags = [],
  initialYear = null,
}: Props) {
  const [category, setCategory] = useState<string | null>(initialCategory)
  const [selectedTags, setSelectedTags] = useState<string[]>(() => initialTags)
  const [year, setYear] = useState<number | null>(initialYear)

  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (selectedTags.length) params.set('tags', selectedTags.join(','))
    if (year) params.set('year', String(year))
    const url = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    history.replaceState(null, '', url)
    filterTimeline(category, selectedTags, year)
  }, [category, selectedTags, year])

  const sortedCategories = useMemo(() => [...new Set(categories)].sort(), [categories])
  const sortedTags = useMemo(() => [...new Set(tags)].sort(), [tags])
  const sortedYears = useMemo(() => [...new Set(years)].sort((a, b) => b - a), [years])

  const hasFilter = category !== null || selectedTags.length > 0 || year !== null

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle icon={riFolder2Line}>分类</SectionTitle>
        {hasFilter && (
          <button
            className="inline-flex items-center gap-1 text-xs text-secondary hover:text-accent transition-colors"
            onClick={clearAll}
            title="清空筛选"
          >
            <StaticIcon icon={riRestartLine} className="size-4" />
            清空
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map((c) => (
          <button
            key={c}
            onClick={() => toggleCategory(c)}
            className={`${chipBase} ${category === c ? chipOn : chipOff}`}
          >
            {c}
          </button>
        ))}
      </div>
      <SectionTitle icon={riPriceTag3Line}>标签</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((t) => {
          const active = selectedTags.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`${chipBase} ${active ? chipOn : chipOff}`}
            >
              #{t}
            </button>
          )
        })}
      </div>
      <SectionTitle icon={riCalendar2Line}>年份</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {sortedYears.map((y) => (
          <button
            key={y}
            onClick={() => toggleYear(y)}
            className={`${chipBase} font-['Atkinson'] ${year === y ? chipOn : chipOff}`}
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
