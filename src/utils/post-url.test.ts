import { describe, expect, it } from 'vitest'
import { getPostUrl, isColumnPost } from './post-url'

describe('post URLs', () => {
  it('uses the columns route for column entries', () => {
    const entry = { id: '专栏/Java/GET与POST请求.md', data: { slug: 'ignored' } }
    expect(isColumnPost(entry)).toBe(true)
    expect(getPostUrl(entry)).toBe('/columns/java/GET与POST请求')
  })

  it('uses the posts route for ordinary entries', () => {
    expect(getPostUrl({ id: '普通文章.md', data: {} })).toBe('/posts/普通文章')
  })

  it('applies a custom slug only to ordinary entries', () => {
    expect(getPostUrl({ id: '普通文章.md', data: { slug: 'custom' } })).toBe('/posts/custom')
    expect(getPostUrl({ id: 'column/Java/ColumnPost.md', data: { slug: 'custom' } })).toBe(
      '/columns/java/ColumnPost',
    )
  })
})
