import { useEffect, useState } from 'react'

type ColumnMeta = { slug: string; title: string; count: number }

export default function ColumnQuickMenu() {
  const [cols, setCols] = useState<ColumnMeta[] | null>(null)

  useEffect(() => {
    let aborted = false
    fetch('/columns.json')
      .then((r) => r.json())
      .then((d) => {
        if (!aborted) setCols(d)
      })
      .catch(() => {
        if (!aborted) setCols([])
      })

    return () => {
      aborted = true
    }
  }, [])

  return (
    <div className="w-full rounded-lg bg-gradient-to-b from-zinc-50/80 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/80 dark:to-zinc-800/90 dark:ring-zinc-100/10">
      <ul className="py-1 text-sm">
        {cols === null ? (
          <li className="px-3 py-2 text-secondary">加载中...</li>
        ) : cols.length === 0 ? (
          <li className="px-3 py-2 text-secondary">暂无专栏</li>
        ) : (
          cols.map((c) => (
            <li key={c.slug}>
              <a
                className="block whitespace-nowrap px-3 py-1.5 text-center hover:text-accent hover:bg-secondary/60 rounded"
                href={`/columns/${c.slug}`}
              >
                {c.title}
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
