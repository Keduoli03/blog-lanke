import { describe, expect, it } from 'vitest'
import { resolveAgentRoute } from './agent-routing'

describe('agent routing', () => {
  it('redirects encoded legacy titles with or without a trailing slash', () => {
    const encoded = '/posts/%E4%B8%89%E9%81%93%E5%89%8D%E7%AB%AF%E9%A2%98/'
    expect(resolveAgentRoute(encoded)).toEqual({ type: 'redirect', pathname: '/posts/722' })
    expect(resolveAgentRoute('/posts/三道前端题')).toEqual({
      type: 'redirect',
      pathname: '/posts/722',
    })
  })

  it('rewrites Markdown negotiation before static HTML can win', () => {
    expect(resolveAgentRoute('/', 'text/markdown')).toEqual({
      type: 'rewrite',
      pathname: '/llms.txt',
    })
    expect(resolveAgentRoute('/posts/astro-llms-txt/', 'text/markdown')).toEqual({
      type: 'rewrite',
      pathname: '/posts/astro-llms-txt.md',
    })
    expect(resolveAgentRoute('/columns/linux/基础操作指令', 'text/markdown')).toEqual({
      type: 'rewrite',
      pathname: '/columns/linux/基础操作指令.md',
    })
  })

  it('leaves HTML, Markdown files, and column indexes unchanged', () => {
    expect(resolveAgentRoute('/posts/astro-llms-txt', 'text/html')).toEqual({ type: 'next' })
    expect(resolveAgentRoute('/posts/astro-llms-txt.md', 'text/markdown')).toEqual({ type: 'next' })
    expect(resolveAgentRoute('/columns/linux/', 'text/markdown')).toEqual({ type: 'next' })
  })
})
