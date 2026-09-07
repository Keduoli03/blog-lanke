import { describe, expect, it } from 'vitest'
import {
  INLINE_COMMENT_HASH_PREFIX,
  appendInlineCommentLocator,
  buildInlineCommentDraft,
  buildInlineCommentContent,
  getInlineCommentBody,
  getInlineCommentSelector,
  groupInlineDiscussions,
  type InlineCommentData,
  type InlineCommentSelector,
} from './inline-comments'

const selector: InlineCommentSelector = {
  version: 2,
  pageKey: '/posts/test',
  anchorId: 'anchor1',
  quote: '这是一段测试文字',
  prefix: '前文',
  suffix: '后文',
  blockHash: 'block1',
  startOffset: 2,
  endOffset: 10,
}

describe('inline comment metadata', () => {
  it('keeps metadata out of the editor draft and injects a compact locator on submit', () => {
    const draft = buildInlineCommentDraft(selector, '我的看法')
    expect(draft).not.toContain(INLINE_COMMENT_HASH_PREFIX)

    const content = appendInlineCommentLocator(draft, selector)
    expect(content).toContain('> 这是一段测试文字')
    expect(content).toContain('[定位到原文]')
    expect(content.split('\n').at(-1)?.length).toBeLessThan(80)
    expect(getInlineCommentSelector(content)).toMatchObject({
      version: 2,
      anchorId: selector.anchorId,
      quote: selector.quote,
      blockHash: selector.blockHash,
      startOffset: selector.startOffset,
      endOffset: selector.endOffset,
    })
    expect(getInlineCommentBody(content)).toBe('我的看法')
  })

  it('counts replies with the inline discussion of their ancestor', () => {
    const root = {
      id: 1,
      rid: 0,
      nick: 'A',
      date: '2026-09-08',
      content: buildInlineCommentContent(selector, '第一条'),
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
