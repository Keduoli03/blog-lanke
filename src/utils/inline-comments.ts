export const INLINE_COMMENT_HASH_PREFIX = '#artalk-inline-v2.'

export interface InlineCommentSelector {
  version: 2
  pageKey: string
  anchorId: string
  quote: string
  prefix: string
  suffix: string
  blockHash: string
  startOffset: number
  endOffset: number
}

export interface InlineCommentData {
  id: number
  content: string
  nick: string
  rid: number
  date: string
  [key: string]: unknown
}

export interface InlineDiscussion {
  selector: InlineCommentSelector
  comments: InlineCommentData[]
}

const SENTENCE_END = /[。！？!?…\n]/
const SENTENCE_CLOSER = /[”’"'」』）》】）\]}…]/

function isSentenceEnd(value: string, index: number) {
  const character = value[index]
  if (SENTENCE_END.test(character)) return true
  if (character !== '.') return false
  const previous = value[index - 1] ?? ''
  const next = value[index + 1] ?? ''
  if (/\d/.test(previous) && /\d/.test(next)) return false
  return !next || /\s/.test(next) || SENTENCE_CLOSER.test(next)
}

export function expandInlineCommentRange(
  value: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const lower = Math.max(0, Math.min(selectionStart, selectionEnd, value.length))
  const upper = Math.max(0, Math.min(Math.max(selectionStart, selectionEnd), value.length))
  let startOffset = 0
  let endOffset = value.length

  for (let index = lower - 1; index >= 0; index -= 1) {
    if (!isSentenceEnd(value, index)) continue
    startOffset = index + 1
    while (
      startOffset < value.length &&
      (SENTENCE_CLOSER.test(value[startOffset]) || /\s/.test(value[startOffset]))
    )
      startOffset += 1
    break
  }

  for (let index = Math.max(lower, upper - 1); index < value.length; index += 1) {
    if (!isSentenceEnd(value, index)) continue
    endOffset = index + 1
    while (
      endOffset < value.length &&
      (isSentenceEnd(value, endOffset) || SENTENCE_CLOSER.test(value[endOffset]))
    )
      endOffset += 1
    break
  }

  while (startOffset < endOffset && /\s/.test(value[startOffset])) startOffset += 1
  while (endOffset > startOffset && /\s/.test(value[endOffset - 1])) endOffset -= 1
  return { startOffset, endOffset }
}

export function hashInlineCommentValue(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

export function normalizeInlinePageKey(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

export function getInlineCommentSelector(content: string) {
  const compactPrefix = INLINE_COMMENT_HASH_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const compactMatch = content.match(
    new RegExp(`${compactPrefix}([a-z0-9]+)\\.([a-z0-9]+)\\.([a-z0-9]+)\\.([a-z0-9]+)`, 'i'),
  )
  if (compactMatch) {
    const quote = getInlineCommentQuote(content)
    const startOffset = Number.parseInt(compactMatch[3], 36)
    const endOffset = Number.parseInt(compactMatch[4], 36)
    if (quote && Number.isFinite(startOffset) && Number.isFinite(endOffset)) {
      return {
        version: 2,
        pageKey: '',
        anchorId: compactMatch[1],
        quote,
        prefix: '',
        suffix: '',
        blockHash: compactMatch[2],
        startOffset,
        endOffset,
      } satisfies InlineCommentSelector
    }
  }
  return null
}

export function getInlineCommentQuote(content: string) {
  const quoteLines: string[] = []
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith('>')) break
    quoteLines.push(line.replace(/^> ?/, ''))
  }
  return quoteLines.join('\n').trim()
}

export function getInlineCommentLocator(selector: InlineCommentSelector) {
  return `${INLINE_COMMENT_HASH_PREFIX}${selector.anchorId}.${selector.blockHash}.${selector.startOffset.toString(36)}.${selector.endOffset.toString(36)}`
}

export function appendInlineCommentLocator(content: string, selector: InlineCommentSelector) {
  if (getInlineCommentSelector(content)) return content
  return `${content.trimEnd()}\n\n[定位到原文](${getInlineCommentLocator(selector)})`
}

export function buildInlineCommentDraft(selector: InlineCommentSelector, body = '') {
  const quote = selector.quote
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n')
  return `${quote}\n\n${body}`
}

export function buildInlineCommentContent(selector: InlineCommentSelector, body = '') {
  return appendInlineCommentLocator(buildInlineCommentDraft(selector, body), selector)
}

export function getInlineCommentBody(content: string) {
  const lines = content.split(/\r?\n/)
  while (lines.length && lines[0].startsWith('>')) lines.shift()
  while (lines.length && !lines[0].trim()) lines.shift()
  return lines
    .filter((line) => !line.includes(INLINE_COMMENT_HASH_PREFIX))
    .join('\n')
    .trim()
}

export function groupInlineDiscussions(comments: InlineCommentData[]) {
  const byId = new Map(comments.map((comment) => [comment.id, comment]))
  const directSelectors = new Map<number, InlineCommentSelector>()
  const discussions = new Map<string, InlineDiscussion>()

  comments.forEach((comment) => {
    const selector = getInlineCommentSelector(comment.content)
    if (!selector) return
    directSelectors.set(comment.id, selector)
    if (!discussions.has(selector.anchorId)) {
      discussions.set(selector.anchorId, { selector, comments: [] })
    }
  })

  const findSelector = (comment: InlineCommentData) => {
    let current: InlineCommentData | undefined = comment
    const visited = new Set<number>()
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      const selector = directSelectors.get(current.id)
      if (selector) return selector
      current = current.rid ? byId.get(current.rid) : undefined
    }
    return null
  }

  comments.forEach((comment) => {
    const selector = findSelector(comment)
    if (!selector) return
    const discussion = discussions.get(selector.anchorId) ?? { selector, comments: [] }
    discussion.comments.push(comment)
    discussions.set(selector.anchorId, discussion)
  })

  return discussions
}
