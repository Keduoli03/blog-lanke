import { describe, expect, it } from 'vitest'
import {
  buildInlineCommentContent,
  decodeInlineCommentSelector,
  encodeInlineCommentSelector,
  getInlineCommentBody,
  getInlineCommentSelector,
  groupInlineDiscussions,
  type InlineCommentData,
  type InlineCommentSelector,
} from './inline-comments'

const selector: InlineCommentSelector = {
  version: 1,
  pageKey: '/posts/test',
  anchorId: 'anchor-1',
  quote: '这是一段测试文字',
  prefix: '前文',
  suffix: '后文',
  blockHash: 'block-1',
  startOffset: 2,
  endOffset: 10,
}

describe('inline comment metadata', () => {
  it('round trips unicode selectors through a URL-safe payload', () => {
    const encoded = encodeInlineCommentSelector(selector)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeInlineCommentSelector(encoded)).toEqual(selector)
  })

  it('builds readable Artalk content and extracts its metadata and body', () => {
    const content = buildInlineCommentContent(selector, 'https://blog.test/posts/test', '我的看法')
    expect(content).toContain('> 这是一段测试文字')
    expect(content).toContain('[定位到原文]')
    expect(getInlineCommentSelector(content)).toEqual(selector)
    expect(getInlineCommentBody(content)).toBe('我的看法')
  })

  it('counts replies with the inline discussion of their ancestor', () => {
    const root = {
      id: 1,
      rid: 0,
      nick: 'A',
      date: '2026-09-08',
      content: buildInlineCommentContent(selector, 'https://blog.test/posts/test', '第一条'),
    }
    const comments: InlineCommentData[] = [
      root,
      { id: 2, rid: 1, nick: 'B', date: '2026-09-08', content: '回复' },
      { id: 3, rid: 0, nick: 'C', date: '2026-09-08', content: '普通评论' },
    ]
    const discussion = groupInlineDiscussions(comments).get(selector.anchorId)
    expect(discussion?.comments.map((comment) => comment.id)).toEqual([1, 2])
  })
})
