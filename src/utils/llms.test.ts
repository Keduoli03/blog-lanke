import { describe, expect, it } from 'vitest'
import { formatPostMarkdown } from './post-markdown'

describe('formatPostMarkdown', () => {
  it('includes title, summary and body', () => {
    const markdown = formatPostMarkdown({
      id: 'demo.md',
      data: {
        title: '示例文章',
        summary: '这是一段摘要',
        date: new Date('2026-01-01T00:00:00+08:00'),
        category: '博客',
        tags: ['Astro', 'llms.txt'],
      },
      body: '## 正文\n\nHello llms.txt',
    } as never)

    expect(markdown).toContain('# 示例文章')
    expect(markdown).toContain('> 这是一段摘要')
    expect(markdown).toContain('分类：博客')
    expect(markdown).toContain('标签：Astro、llms.txt')
    expect(markdown).toContain('## 正文')
  })
})
