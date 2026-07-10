import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPostRouteProps } from './post-route'

describe('post route props', () => {
  it('keeps ordinary posts as rendered content', () => {
    const post = { id: '普通文章.md', data: {} }
    expect(getPostRouteProps(post)).toEqual({ current: post })
  })

  it('turns column posts into static HTML redirect props', () => {
    const post = { id: '专栏/Java/GET与POST请求.md', data: {} }
    expect(getPostRouteProps(post)).toEqual({
      redirect: '/columns/java/GET与POST请求',
    })
  })

  it('uses a canonical HTML redirect and indexes the column body', () => {
    const postsRoute = readFileSync(join(process.cwd(), 'src/pages/posts/[...slug].astro'), 'utf8')
    const columnRoute = readFileSync(
      join(process.cwd(), 'src/pages/columns/[column]/[post].astro'),
      'utf8',
    )
    expect(postsRoute).not.toContain('Astro.redirect')
    expect(postsRoute).toContain('<meta http-equiv="refresh" content={`0;url=${redirect}`} />')
    expect(postsRoute).toContain('<link rel="canonical" href={redirectCanonical} />')
    expect(columnRoute).toContain('getPublicPosts()')
    expect(columnRoute).toContain('data-pagefind-body')
  })

  it('builds column listings from the cached public post collection', () => {
    const columnIndexRoute = readFileSync(
      join(process.cwd(), 'src/pages/columns/[column].astro'),
      'utf8',
    )

    expect(columnIndexRoute).toContain('getPublicPosts()')
    expect(columnIndexRoute).not.toContain("getCollection('posts')")
  })
})
