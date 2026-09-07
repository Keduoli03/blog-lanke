import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StaticIcon } from '@/components/header/StaticIcon'
import { riChat1Line, riFileCopyLine, riLinkM } from '@/icons/ri'
import {
  INLINE_COMMENT_HASH_PREFIX,
  appendInlineCommentLocator,
  buildInlineCommentDraft,
  expandInlineCommentRange,
  getInlineCommentBody,
  getInlineCommentLocator,
  groupInlineDiscussions,
  hashInlineCommentValue,
  normalizeInlinePageKey,
  type InlineCommentData,
  type InlineCommentSelector,
  type InlineDiscussion,
} from '@/utils/inline-comments'

const COMMENTABLE_SELECTOR = 'p, li, blockquote, h2, h3, h4, h5, h6, td, th'
const MAX_QUOTE_LENGTH = 500

interface ArtalkEditor {
  getEl(): HTMLElement
  getContentRaw(): string
  getUI(): { $textarea: HTMLTextAreaElement }
  setContent(value: string): void
  focus(): void
  getPlugins():
    | {
        getTransformedContent(rawContent: string): string
      }
    | undefined
}

interface ArtalkInstance {
  ctx: { editor: ArtalkEditor }
  getEl(): HTMLElement
  reload(): void
  on(name: string, handler: (comment?: InlineCommentData) => void): void
  off(name: string, handler: (comment?: InlineCommentData) => void): void
}

interface ArtalkReadyDetail {
  instance: ArtalkInstance
  pageKey: string
}

interface MenuState {
  left: number
  top: number
  selectionText: string
}

interface ResolvedAnchor {
  block: HTMLElement
  range: Range
}

function getWindowArtalk() {
  return (
    window as typeof window & {
      __articleArtalk?: ArtalkReadyDetail
    }
  ).__articleArtalk
}

function getCleanBlockText(block: HTMLElement) {
  const clone = block.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-inline-comment-badge]').forEach((badge) => badge.remove())
  return clone.textContent ?? ''
}

function getBoundaryOffset(block: HTMLElement, container: Node, offset: number) {
  const range = document.createRange()
  range.selectNodeContents(block)
  try {
    range.setEnd(container, offset)
  } catch {
    return null
  }
  const fragment = range.cloneContents()
  const wrapper = document.createElement('div')
  wrapper.append(fragment)
  wrapper.querySelectorAll('[data-inline-comment-badge]').forEach((badge) => badge.remove())
  return (wrapper.textContent ?? '').length
}

function getTextBoundary(block: HTMLElement, targetOffset: number) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return (node.parentElement?.closest('[data-inline-comment-badge]') ?? null)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
    },
  })
  let consumed = 0
  let node = walker.nextNode()
  while (node) {
    const length = node.textContent?.length ?? 0
    if (consumed + length >= targetOffset) {
      return { node, offset: Math.max(0, targetOffset - consumed) }
    }
    consumed += length
    node = walker.nextNode()
  }
  return null
}

function createRangeForOffsets(block: HTMLElement, startOffset: number, endOffset: number) {
  const start = getTextBoundary(block, startOffset)
  const end = getTextBoundary(block, endOffset)
  if (!start || !end) return null
  const range = document.createRange()
  range.setStart(start.node, start.offset)
  range.setEnd(end.node, end.offset)
  return range
}

function normalizeBlockText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function captureSelector(article: HTMLElement, pageKey: string) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null
  const range = selection.getRangeAt(0)
  const startElement =
    range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement
  const endElement =
    range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement
  const startBlock = startElement?.closest<HTMLElement>(COMMENTABLE_SELECTOR)
  const endBlock = endElement?.closest<HTMLElement>(COMMENTABLE_SELECTOR)
  if (!startBlock || startBlock !== endBlock || !article.contains(startBlock)) return null
  if (
    startElement?.closest('pre, code, .expressive-code, .artalk, [data-inline-comments-ui]') ||
    endElement?.closest('pre, code, .expressive-code, .artalk, [data-inline-comments-ui]')
  ) {
    return null
  }

  const blockText = getCleanBlockText(startBlock)
  const initialStart = getBoundaryOffset(startBlock, range.startContainer, range.startOffset)
  const initialEnd = getBoundaryOffset(startBlock, range.endContainer, range.endOffset)
  if (initialStart === null || initialEnd === null) return null

  let startOffset = Math.min(initialStart, initialEnd)
  let endOffset = Math.max(initialStart, initialEnd)
  while (startOffset < endOffset && /\s/.test(blockText[startOffset])) startOffset += 1
  while (endOffset > startOffset && /\s/.test(blockText[endOffset - 1])) endOffset -= 1
  const selectedQuote = blockText.slice(startOffset, endOffset)
  if (!selectedQuote) return null
  const expanded = expandInlineCommentRange(blockText, startOffset, endOffset)
  if (expanded.endOffset - expanded.startOffset <= MAX_QUOTE_LENGTH) {
    startOffset = expanded.startOffset
    endOffset = expanded.endOffset
  }
  const quote = blockText.slice(startOffset, endOffset)
  if (!quote || quote.length > MAX_QUOTE_LENGTH) return null

  const prefix = blockText.slice(Math.max(0, startOffset - 36), startOffset)
  const suffix = blockText.slice(endOffset, endOffset + 36)
  const blockHash = hashInlineCommentValue(normalizeBlockText(blockText))
  const anchorId = hashInlineCommentValue(
    `${pageKey}\n${blockHash}\n${startOffset}\n${quote}\n${prefix}\n${suffix}`,
  )
  return {
    version: 2,
    pageKey,
    anchorId,
    quote,
    prefix,
    suffix,
    blockHash,
    startOffset,
    endOffset,
  } satisfies InlineCommentSelector
}

function resolveSelector(
  article: HTMLElement,
  selector: InlineCommentSelector,
): ResolvedAnchor | null {
  const blocks = Array.from(article.querySelectorAll<HTMLElement>(COMMENTABLE_SELECTOR)).filter(
    (block) => !block.closest('pre, code, .expressive-code, .artalk, [data-inline-comments-ui]'),
  )
  let best: { block: HTMLElement; start: number; score: number } | null = null

  blocks.forEach((block) => {
    const text = getCleanBlockText(block)
    const hashMatches = hashInlineCommentValue(normalizeBlockText(text)) === selector.blockHash
    if (hashMatches && text.slice(selector.startOffset, selector.endOffset) === selector.quote) {
      best = { block, start: selector.startOffset, score: Number.MAX_SAFE_INTEGER }
      return
    }

    let start = text.indexOf(selector.quote)
    while (start !== -1) {
      const prefix = text.slice(Math.max(0, start - selector.prefix.length), start)
      const suffix = text.slice(
        start + selector.quote.length,
        start + selector.quote.length + selector.suffix.length,
      )
      let score = hashMatches ? 1000 : 0
      if (selector.prefix && prefix === selector.prefix) score += 100
      if (selector.suffix && suffix === selector.suffix) score += 100
      score -= Math.abs(start - selector.startOffset) / 1000
      if (!best || score > best.score) best = { block, start, score }
      start = text.indexOf(selector.quote, start + 1)
    }
  })

  if (!best) return null
  const found = best as { block: HTMLElement; start: number; score: number }
  const range = createRangeForOffsets(found.block, found.start, found.start + selector.quote.length)
  return range ? { block: found.block, range } : null
}

function formatCommentDate(value: string) {
  const parsed = new Date(value.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed)
}

export function InlineComments({
  server,
  site,
  pathname,
}: {
  server: string
  site: string
  pathname: string
}) {
  const pageKey = normalizeInlinePageKey(pathname)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [copyComplete, setCopyComplete] = useState(false)
  const [pendingSelector, setPendingSelector] = useState<InlineCommentSelector | null>(null)
  const [activeSelector, setActiveSelector] = useState<InlineCommentSelector | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [instance, setInstance] = useState<ArtalkInstance | null>(null)
  const [comments, setComments] = useState<InlineCommentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const composerHostRef = useRef<HTMLDivElement>(null)
  const editorPlaceholderRef = useRef<Comment | null>(null)
  const movedEditorRef = useRef<HTMLElement | null>(null)
  const preparedContentRef = useRef('')
  const refreshTimerRef = useRef<number | null>(null)
  const copyTimerRef = useRef<number | null>(null)

  const discussions = useMemo(() => groupInlineDiscussions(comments), [comments])
  const activeDiscussion = activeSelector ? discussions.get(activeSelector.anchorId) : undefined

  const loadComments = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setLoadError(false)
      try {
        const all: InlineCommentData[] = []
        const limit = 100
        let total = 0
        do {
          const url = new URL('/api/v2/comments', server)
          url.searchParams.set('site_name', site)
          url.searchParams.set('page_key', pageKey)
          url.searchParams.set('flat_mode', 'true')
          url.searchParams.set('limit', String(limit))
          url.searchParams.set('offset', String(all.length))
          const response = await fetch(url, { signal })
          if (!response.ok) throw new Error(`Artalk returned ${response.status}`)
          const payload = (await response.json()) as {
            comments?: InlineCommentData[]
            count?: number
          }
          const next = payload.comments ?? []
          all.push(...next)
          total = payload.count ?? all.length
          if (!next.length) break
        } while (all.length < total)
        setComments(all)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setLoadError(true)
      } finally {
        if (!signal?.aborted) setIsLoading(false)
      }
    },
    [pageKey, server, site],
  )

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = window.setTimeout(() => {
      void loadComments()
      refreshTimerRef.current = null
    }, 250)
  }, [loadComments])

  const openSelector = useCallback((selector: InlineCommentSelector) => {
    setMenu(null)
    setPendingSelector(null)
    setActiveSelector(selector)
    setIsOpen(true)
    const article = document.getElementById('markdown-wrapper')
    if (article) {
      const resolved = resolveSelector(article, selector)
      resolved?.block.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const locateSelector = useCallback((selector: InlineCommentSelector) => {
    const article = document.getElementById('markdown-wrapper')
    if (!article) return
    const resolved = resolveSelector(article, selector)
    if (!resolved) return

    setMenu(null)
    setIsOpen(false)
    const rect = resolved.range.getBoundingClientRect()
    window.scrollTo({
      top: Math.max(0, window.scrollY + rect.top - window.innerHeight * 0.38),
      behavior: 'smooth',
    })
    resolved.block.classList.remove('inline-comment-located')
    void resolved.block.offsetWidth
    resolved.block.classList.add('inline-comment-located')
    window.setTimeout(() => resolved.block.classList.remove('inline-comment-located'), 1800)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadComments(controller.signal)
    return () => controller.abort()
  }, [loadComments])

  useEffect(() => {
    const onReady = (event: Event) => {
      const detail = (event as CustomEvent<ArtalkReadyDetail>).detail
      if (detail.pageKey === pageKey) setInstance(detail.instance)
    }
    const onDestroyed = (event: Event) => {
      const detail = (event as CustomEvent<ArtalkReadyDetail>).detail
      if (detail.pageKey === pageKey) setInstance(null)
    }
    window.addEventListener('artalk:ready', onReady)
    window.addEventListener('artalk:destroyed', onDestroyed)
    const current = getWindowArtalk()
    if (current?.pageKey === pageKey) setInstance(current.instance)
    return () => {
      window.removeEventListener('artalk:ready', onReady)
      window.removeEventListener('artalk:destroyed', onDestroyed)
    }
  }, [pageKey])

  useEffect(() => {
    if (!instance) return
    const onChange = (comment?: InlineCommentData) => {
      scheduleRefresh()
      if (comment && activeSelector && comment.content.includes(INLINE_COMMENT_HASH_PREFIX)) {
        setIsOpen(false)
      }
    }
    instance.on('comment-inserted', onChange)
    instance.on('comment-updated', onChange)
    instance.on('comment-deleted', onChange)
    return () => {
      instance.off('comment-inserted', onChange)
      instance.off('comment-updated', onChange)
      instance.off('comment-deleted', onChange)
    }
  }, [activeSelector, instance, scheduleRefresh])

  useEffect(() => {
    const article = document.getElementById('markdown-wrapper')
    if (!article) return

    const showMenu = (
      selector: InlineCommentSelector | null,
      selectionText: string,
      left: number,
      top: number,
    ) => {
      setPendingSelector(selector)
      setCopyComplete(false)
      setMenu({
        left: Math.min(Math.max(12, left), window.innerWidth - 224),
        top: Math.min(Math.max(12, top), window.innerHeight - 116),
        selectionText,
      })
    }
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), .artalk, [data-inline-comments-ui]',
        )
      )
        return

      const selector = captureSelector(article, pageKey)
      const selectionText = window.getSelection()?.toString().trim() ?? ''
      event.preventDefault()
      const targetRect = target instanceof Element ? target.getBoundingClientRect() : null
      showMenu(
        selector,
        selectionText,
        event.clientX || targetRect?.left || 12,
        event.clientY || targetRect?.bottom || 12,
      )
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && !window.matchMedia('(pointer: coarse)').matches) return
      window.setTimeout(() => {
        const selector = captureSelector(article, pageKey)
        const selection = window.getSelection()
        if (!selector || !selection?.rangeCount) return
        const rect = selection.getRangeAt(0).getBoundingClientRect()
        showMenu(selector, selection.toString().trim(), rect.right, rect.bottom + 8)
      })
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Element && !target.closest('[data-inline-comments-ui]')) setMenu(null)
    }
    document.addEventListener('contextmenu', onContextMenu)
    article.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      article.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [pageKey])

  useEffect(() => {
    const article = document.getElementById('markdown-wrapper')
    if (!article) return
    article.querySelectorAll('[data-inline-comment-badge]').forEach((badge) => badge.remove())
    article.normalize()

    const resolved = Array.from(discussions.values())
      .map((discussion) => ({ discussion, anchor: resolveSelector(article, discussion.selector) }))
      .filter(
        (item): item is { discussion: InlineDiscussion; anchor: ResolvedAnchor } => !!item.anchor,
      )
      .sort((a, b) => b.discussion.selector.endOffset - a.discussion.selector.endOffset)

    resolved.forEach(({ discussion, anchor }) => {
      const badge = document.createElement('button')
      badge.type = 'button'
      badge.className = 'inline-comment-badge'
      badge.dataset.inlineCommentBadge = discussion.selector.anchorId
      badge.setAttribute('aria-label', `查看这段文字的 ${discussion.comments.length} 条评论`)
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('viewBox', '0 0 24 24')
      icon.setAttribute('aria-hidden', 'true')
      icon.classList.add('inline-comment-badge-icon')
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('fill', 'currentColor')
      path.setAttribute(
        'd',
        'M10 3h4a8 8 0 1 1 0 16v3.5c-5-2-12-5-12-11.5a8 8 0 0 1 8-8m2 14h2a6 6 0 0 0 0-12h-4a6 6 0 0 0-6 6c0 3.61 2.462 5.966 8 8.48z',
      )
      icon.append(path)
      const count = document.createElement('span')
      count.textContent = String(discussion.comments.length)
      badge.append(icon, count)
      badge.addEventListener('click', () => openSelector(discussion.selector))
      const insertion = anchor.range.cloneRange()
      insertion.collapse(false)
      insertion.insertNode(badge)
    })

    return () => {
      article.querySelectorAll('[data-inline-comment-badge]').forEach((badge) => badge.remove())
      article.normalize()
    }
  }, [discussions, openSelector, pageKey])

  useEffect(() => {
    if (!isOpen || !activeSelector || !instance || !composerHostRef.current) return
    const editor = instance.ctx.editor
    const editorEl = editor.getEl()
    const raw = editor.getContentRaw().trim()
    if (raw && raw !== preparedContentRef.current) {
      const replace = window.confirm('评论框中已有未发送的内容，是否替换为当前划词评论？')
      if (!replace) {
        setIsOpen(false)
        instance.getEl().scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    if (!editorPlaceholderRef.current && editorEl.parentNode) {
      const placeholder = document.createComment('inline-comment-editor-placeholder')
      editorEl.parentNode.insertBefore(placeholder, editorEl)
      editorPlaceholderRef.current = placeholder
      movedEditorRef.current = editorEl
      composerHostRef.current.appendChild(editorEl)
    }

    const content = buildInlineCommentDraft(activeSelector)
    preparedContentRef.current = content.trim()
    editor.setContent(content)
    const plugins = editor.getPlugins()
    const originalTransformer = plugins?.getTransformedContent
    if (plugins && originalTransformer) {
      plugins.getTransformedContent = (rawContent: string) =>
        appendInlineCommentLocator(originalTransformer.call(plugins, rawContent), activeSelector)
    }
    const cursor =
      activeSelector.quote
        .split(/\r?\n/)
        .map((line) => `> ${line}`)
        .join('\n').length + 2
    window.requestAnimationFrame(() => {
      const textarea = editor.getUI().$textarea
      textarea.setSelectionRange(cursor, cursor)
      editor.focus()
    })

    return () => {
      if (plugins && originalTransformer) plugins.getTransformedContent = originalTransformer
    }
  }, [activeSelector, instance, isOpen])

  useEffect(() => {
    if (isOpen) return
    const placeholder = editorPlaceholderRef.current
    const editor = movedEditorRef.current
    if (placeholder?.parentNode && editor) placeholder.parentNode.insertBefore(editor, placeholder)
    placeholder?.remove()
    editorPlaceholderRef.current = null
    movedEditorRef.current = null
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    document.documentElement.classList.add('inline-comments-open')
    document.body.classList.add('inline-comments-open')
    return () => {
      document.documentElement.classList.remove('inline-comments-open')
      document.body.classList.remove('inline-comments-open')
    }
  }, [isOpen])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(null)
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current)
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
      const placeholder = editorPlaceholderRef.current
      const editor = movedEditorRef.current
      if (placeholder?.parentNode && editor)
        placeholder.parentNode.insertBefore(editor, placeholder)
      placeholder?.remove()
    }
  }, [])

  useEffect(() => {
    const locateFromHash = (hash: string) => {
      const discussion = Array.from(discussions.values()).find(
        ({ selector }) => getInlineCommentLocator(selector) === hash,
      )
      if (discussion) locateSelector(discussion.selector)
    }
    const onLocatorClick = (event: MouseEvent) => {
      const target = event.target
      const link = target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link) return
      const url = new URL(link.href, window.location.href)
      if (
        !url.hash.startsWith(INLINE_COMMENT_HASH_PREFIX) ||
        url.pathname !== window.location.pathname
      )
        return
      const discussion = Array.from(discussions.values()).find(
        ({ selector }) => getInlineCommentLocator(selector) === url.hash,
      )
      if (!discussion) return
      event.preventDefault()
      event.stopPropagation()
      window.history.replaceState(null, '', url.hash)
      locateSelector(discussion.selector)
    }
    const onHashChange = () => locateFromHash(window.location.hash)
    document.addEventListener('click', onLocatorClick, true)
    window.addEventListener('hashchange', onHashChange)
    const initialTimer = window.setTimeout(onHashChange)
    return () => {
      document.removeEventListener('click', onLocatorClick, true)
      window.removeEventListener('hashchange', onHashChange)
      window.clearTimeout(initialTimer)
    }
  }, [discussions, locateSelector])

  const copyFromMenu = useCallback(async () => {
    if (!menu) return
    const value = menu.selectionText || `${window.location.origin}${window.location.pathname}`
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopyComplete(true)
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setMenu(null), 700)
  }, [menu])

  return (
    <div data-inline-comments-ui>
      {menu && (
        <div
          className="inline-comment-menu"
          style={{ left: menu.left, top: menu.top }}
          role="menu"
          aria-label="文章操作"
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="inline-comment-menu-item"
            role="menuitem"
            disabled={!pendingSelector}
            onClick={() => pendingSelector && openSelector(pendingSelector)}
          >
            <span className="inline-comment-menu-icon">
              <StaticIcon icon={riChat1Line} />
            </span>
            <span>{pendingSelector ? '评论这段文字' : '选中文字后评论'}</span>
          </button>
          <button
            type="button"
            className="inline-comment-menu-item"
            role="menuitem"
            onClick={() => void copyFromMenu()}
          >
            <span className="inline-comment-menu-icon">
              <StaticIcon icon={menu.selectionText ? riFileCopyLine : riLinkM} />
            </span>
            <span>
              {copyComplete ? '已复制' : menu.selectionText ? '复制选中文字' : '复制页面链接'}
            </span>
          </button>
        </div>
      )}

      {isOpen && activeSelector && (
        <div className="inline-comment-overlay" role="presentation">
          <button
            type="button"
            className="inline-comment-backdrop"
            aria-label="关闭划词评论"
            onClick={() => setIsOpen(false)}
          />
          <aside
            className="inline-comment-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inline-comment-title"
          >
            <header className="inline-comment-panel-header">
              <div>
                <span className="inline-comment-eyebrow">正文讨论</span>
                <h2 id="inline-comment-title">评论这段文字</h2>
              </div>
              <button
                type="button"
                className="inline-comment-close"
                aria-label="关闭"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </header>

            <blockquote className="inline-comment-quote">{activeSelector.quote}</blockquote>

            <section className="inline-comment-thread" aria-label="相关讨论">
              <div className="inline-comment-thread-heading">
                <h3>相关讨论</h3>
                <span>{activeDiscussion?.comments.length ?? 0} 条</span>
              </div>
              {isLoading ? (
                <p className="inline-comment-status">正在加载评论…</p>
              ) : loadError ? (
                <button
                  type="button"
                  className="inline-comment-retry"
                  onClick={() => loadComments()}
                >
                  加载失败，点击重试
                </button>
              ) : activeDiscussion?.comments.length ? (
                <div className="inline-comment-thread-list">
                  {activeDiscussion.comments.map((comment) => (
                    <article
                      className="inline-comment-thread-item"
                      data-reply={comment.rid ? 'true' : 'false'}
                      key={comment.id}
                    >
                      <div className="inline-comment-thread-meta">
                        <strong>{comment.nick}</strong>
                        <time>{formatCommentDate(comment.date)}</time>
                      </div>
                      <p>{getInlineCommentBody(comment.content) || '回复了这条讨论'}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="inline-comment-status">还没有讨论，来说说你的看法吧。</p>
              )}
            </section>

            <section className="inline-comment-composer" aria-label="发表评论">
              {!instance && <p className="inline-comment-status">正在加载 Artalk 编辑器…</p>}
              <div ref={composerHostRef} className="artalk inline-comment-artalk-host" />
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
