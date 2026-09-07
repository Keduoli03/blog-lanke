import { describe, expect, it } from 'vitest'
import {
  INLINE_COMMENT_HASH_PREFIX,
  appendInlineCommentLocator,
  buildInlineCommentDraft,
  buildInlineCommentContent,
  expandInlineCommentRange,
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
  it('expands a short selection to complete sentence boundaries', () => {
    const text = '第一句话。这里是需要评论的完整一句话！最后一句。'
    const start = text.indexOf('需要')
    expect(expandInlineCommentRange(text, start, start + 2)).toEqual({
      startOffset: text.indexOf('这里'),
      endOffset: text.indexOf('！') + 1,
    })
  })

  it('keeps closing quotation marks and avoids splitting decimal numbers', () => {
    const quoted = '他说：“版本是 2.5。” 下一句。'
    const start = quoted.indexOf('版本')
    const range = expandInlineCommentRange(quoted, start, start + 2)
    expect(quoted.slice(range.startOffset, range.endOffset)).toBe('他说：“版本是 2.5。”')
  })

  it('uses the complete block when it has no sentence punctuation', () => {
    expect(expandInlineCommentRange('没有标点的标题文字', 2, 4)).toEqual({
      startOffset: 0,
      endOffset: 9,
    })
  })

  it('treats semicolons as part of one sentence and ellipses as sentence endings', () => {
    const text = '前半句；后半句仍属于同一句。新的想法……再下一句。'
    const semicolonStart = text.indexOf('后半句')
    const semicolonRange = expandInlineCommentRange(text, semicolonStart, semicolonStart + 2)
    expect(text.slice(semicolonRange.startOffset, semicolonRange.endOffset)).toBe(
      '前半句；后半句仍属于同一句。',
    )

    const ellipsisStart = text.indexOf('新的')
    const ellipsisRange = expandInlineCommentRange(text, ellipsisStart, ellipsisStart + 2)
    expect(text.slice(ellipsisRange.startOffset, ellipsisRange.endOffset)).toBe('新的想法……')
  })

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
