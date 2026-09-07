export const INLINE_COMMENT_HASH_PREFIX = '#artalk-inline-v1.'

export interface InlineCommentSelector {
  version: 1
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

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
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

export function encodeInlineCommentSelector(selector: InlineCommentSelector) {
  return encodeBase64Url(JSON.stringify(selector))
}

export function decodeInlineCommentSelector(encoded: string): InlineCommentSelector | null {
  try {
    const value = JSON.parse(decodeBase64Url(encoded)) as Partial<InlineCommentSelector>
    if (
      value.version !== 1 ||
      typeof value.pageKey !== 'string' ||
      typeof value.anchorId !== 'string' ||
      typeof value.quote !== 'string' ||
      typeof value.prefix !== 'string' ||
      typeof value.suffix !== 'string' ||
      typeof value.blockHash !== 'string' ||
      typeof value.startOffset !== 'number' ||
      typeof value.endOffset !== 'number'
    ) {
      return null
    }
    return value as InlineCommentSelector
  } catch {
    return null
  }
}

export function getInlineCommentSelector(content: string) {
  const prefix = INLINE_COMMENT_HASH_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = content.match(new RegExp(`${prefix}([A-Za-z0-9_-]+)`))
  return match ? decodeInlineCommentSelector(match[1]) : null
}

export function buildInlineCommentContent(
  selector: InlineCommentSelector,
  pageUrl: string,
  body = '',
) {
  const quote = selector.quote
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n')
  const baseUrl = pageUrl.split('#')[0]
  const locator = `${baseUrl}${INLINE_COMMENT_HASH_PREFIX}${encodeInlineCommentSelector(selector)}`
  return `${quote}\n\n${body}\n\n[定位到原文](${locator})`
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
