import type { CollectionEntry } from 'astro:content'

export function formatPostMarkdown(post: CollectionEntry<'posts'>) {
  const { title, summary, date, category, tags } = post.data
  const lines = [`# ${title}`, '']

  if (summary) {
    lines.push(`> ${summary}`, '')
  }

  const meta: string[] = []
  if (date) meta.push(`发布：${date.toISOString().slice(0, 10)}`)
  if (category) meta.push(`分类：${category}`)
  if (tags.length) meta.push(`标签：${tags.join('、')}`)
  if (meta.length) lines.push(meta.join(' | '), '', '')

  if (post.body?.trim()) {
    lines.push(post.body.trim())
  }

  return `${lines.join('\n').trim()}\n`
}

export function markdownResponse(body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
