export default function runMemos() {
  const CONFIG = {
    memos: {
      baseUrl: 'https://memos.blueke.top/',
      limit: 10,
      creatorId: '1',
      username: 'lanke',
      userlink: 'https://memos.blueke.top',
      commentsShow: true,
      commentsTitle: '评论',
    },
    artalk: {
      site: 'Memos',
      server: 'https://artalk.blueke.top',
      commentsUrl: 'https://memos.blueke.top/m/',
    },
    dom: {
      gridContainer: '#memo-grid',
      template: '#memo-item-template',
      loadMore: '#load-more-container',
    },
  }

  let nextToken = ''
  const limit = parseInt(String(CONFIG.memos.limit), 10)
  let memoGrid: HTMLElement | null = document.querySelector(CONFIG.dom.gridContainer)
  let memoTemplate: HTMLTemplateElement | null = document.querySelector(CONFIG.dom.template)
  let loadMoreContainer: HTMLElement | null = document.querySelector(CONFIG.dom.loadMore)
  let isLoadingFirst = false

  function formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  function renderMarkdownBasic(text: string) {
    if (!text) return ''
    let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    s = s.replace(
      /```([\s\S]*?)```/g,
      (_, code) => `<pre><code>${code.replace(/&/g, '&amp;')}</code></pre>`,
    )
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
    s = s
      .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="memo-img" />')
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="memo-link">$1</a>',
    )
    s = s.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
    s = s.replace(/^(?:-\s.*(?:\r?\n|$))+?/gm, (block) => {
      const items = block
        .trim()
        .split(/\r?\n/)
        .map((l) => l.replace(/^-+\s?/, '').trim())
      const li = items
        .filter(Boolean)
        .map((i) => `<li>${i}</li>`)
        .join('')
      return `<ul>${li}</ul>`
    })
    s = s
      .split(/\n{2,}/)
      .map((chunk) => {
        if (/^\s*(<h\d|<ul|<pre|<blockquote|<img|<p)/.test(chunk)) return chunk
        const lines = chunk
          .split(/\n/)
          .map((l) => l.trim())
          .filter(Boolean)
        if (!lines.length) return ''
        return `<p>${lines.join('<br/>')}</p>`
      })
      .join('\n')
    return s
  }

  function renderMemoItem(memo: any) {
    const isoTime = memo.displayTime || memo.createTime
    const createdDate = isoTime ? new Date(isoTime) : new Date()
    const memoId = String(memo.id || (memo.name || '').split('/').pop() || Date.now())
    const frag = (memoTemplate as HTMLTemplateElement).content.cloneNode(true) as DocumentFragment
    const article = frag.firstElementChild as HTMLElement
    article.dataset.id = memoId
    const contentEl = frag.querySelector('.memos-content') as HTMLElement
    contentEl.innerHTML = renderMarkdownBasic(memo.content || '')
    contentEl.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || ''
      if (/^\/(attachments|resources|o)\//.test(src)) {
        ;(img as HTMLImageElement).src = `${CONFIG.memos.baseUrl}${src.slice(1)}`
      } else if (/^(attachments|resources|o)\//.test(src)) {
        ;(img as HTMLImageElement).src = `${CONFIG.memos.baseUrl}${src}`
      }
    })
    if (Array.isArray(memo.attachments) && memo.attachments.length) {
      const wrap = document.createElement('div')
      wrap.className = 'memos-attachments'
      memo.attachments.forEach((att: any) => {
        const id = (att.name || '').split('/').pop()
        const isImg = (att.type || '').startsWith('image/')
        if (isImg) {
          const candidates: string[] = []
          if (att.externalLink) candidates.push(att.externalLink)
          if (id) {
            candidates.push(`${CONFIG.memos.baseUrl}api/v1/attachments/${id}/raw`)
            candidates.push(`${CONFIG.memos.baseUrl}o/${id}`)
          }
          const img = document.createElement('img')
          img.className = 'memo-img'
          let i = 0
          const tryNext = () => {
            if (i >= candidates.length) return
            img.src = candidates[i++]
          }
          img.addEventListener('error', tryNext)
          tryNext()
          wrap.appendChild(img)
        } else {
          const a = document.createElement('a')
          a.href =
            att.externalLink || (id ? `${CONFIG.memos.baseUrl}api/v1/attachments/${id}/raw` : '#')
          a.textContent = att.filename || '附件'
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.className = 'memo-link'
          wrap.appendChild(a)
        }
      })
      contentEl.appendChild(wrap)
    }
    ;(frag.querySelector('.memos-time') as HTMLElement).textContent = formatDate(createdDate)
    const commentBtn = frag.querySelector('.memos-comments') as HTMLElement
    const commentCount = frag.querySelector('.artalk-count') as HTMLElement
    commentBtn.setAttribute('data-id', memoId)
    commentCount.setAttribute('data-page-key', `/m/${memoId}`)
    ;(frag.querySelector('.comment') as HTMLElement).id = memoId
    commentBtn.addEventListener('click', () => loadArtalk(commentBtn))
    return frag
  }

  async function ensureArtalk(): Promise<any> {
    if (!document.querySelector('link[href="https://unpkg.com/artalk@2.9.1/dist/Artalk.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/artalk@2.9.1/dist/Artalk.css'
      document.head.appendChild(link)
    }
    if ((window as any).__Artalk) return (window as any).__Artalk
    if ((window as any).Artalk) {
      ;(window as any).__Artalk = (window as any).Artalk
      return (window as any).Artalk
    }
    await new Promise<void>((resolve) => {
      if (document.getElementById('artalk-js')) {
        const check = () => {
          if ((window as any).Artalk) resolve()
          else setTimeout(check, 50)
        }
        check()
      } else {
        const s = document.createElement('script')
        s.id = 'artalk-js'
        s.src = 'https://unpkg.com/artalk@2.9.1/dist/Artalk.js'
        s.async = true
        s.onload = () => resolve()
        document.head.appendChild(s)
      }
    })
    ;(window as any).__Artalk = (window as any).Artalk
    return (window as any).Artalk
  }

  async function loadArtalk(btn: Element) {
    const id = btn.getAttribute('data-id') || ''
    const item = btn.closest('.memos-item')
    if (!item) return
    const container = document.getElementById('memos-comment-global')
    if (!container) return
    const isOpen = !container.classList.contains('d-none')
    const currentId = container.getAttribute('data-current-id') || ''
    if (isOpen && currentId === id) {
      container.classList.add('d-none')
      container.innerHTML = ''
      container.removeAttribute('data-current-id')
      // @ts-ignore
      ;(window as any).__memosCommentId = null
      return
    }
    container.classList.remove('d-none')
    container.innerHTML = '<div id="artalk"></div>'
    container.setAttribute('data-current-id', id)
    item.insertAdjacentElement('afterend', container)
    const Artalk = await ensureArtalk()
    Artalk.init({
      el: '#artalk',
      pageKey: `/m/${id}`,
      pageTitle: '',
      site: CONFIG.artalk.site,
      server: CONFIG.artalk.server,
      emoticons: false,
    })
    // @ts-ignore
    ;(window as any).__memosCommentId = id
  }

  function updateMemoList(data: any[] = []) {
    if (!memoGrid || data.length === 0) return
    data.forEach((memo) => memoGrid!.appendChild(renderMemoItem(memo)))
    ensureArtalk().then((Artalk) => {
      Artalk.loadCountWidget({
        server: CONFIG.artalk.server,
        site: CONFIG.artalk.site,
        countEl: '.artalk-count',
      })
    })
  }

  function initLoadMoreBtn() {
    if (!loadMoreContainer) return null
    loadMoreContainer.innerHTML = '<button class="load-btn button-load">加载中…</button>'
    const btn = loadMoreContainer.querySelector('.button-load') as HTMLButtonElement
    btn.addEventListener('click', () => {
      btn.textContent = '加载中…'
      getNextPageMemos().then(() => (btn.textContent = '加载更多'))
    })
    return btn
  }

  async function getFirstPageMemos() {
    if (isLoadingFirst) return
    isLoadingFirst = true
    const btn = initLoadMoreBtn()
    const url = `${CONFIG.memos.baseUrl}api/v1/memos?creatorId=${CONFIG.memos.creatorId}&rowStatus=NORMAL&limit=${limit}`
    try {
      const res = await fetch(url)
      const resdata = await res.json()
      const list = Array.isArray(resdata) ? resdata : resdata.memos || []
      nextToken = resdata?.nextPageToken || ''
      updateMemoList(list)
      if (!nextToken || list.length < limit) {
        if (loadMoreContainer) loadMoreContainer.innerHTML = ''
      } else if (btn) {
        btn.textContent = '加载更多'
      }
    } catch (err) {
      if (memoGrid) memoGrid.innerHTML = '<div class="memo-error">加载失败，请检查网络</div>'
      if (loadMoreContainer) loadMoreContainer.innerHTML = ''
    } finally {
      isLoadingFirst = false
    }
  }

  async function getNextPageMemos() {
    if (!nextToken) {
      if (loadMoreContainer) loadMoreContainer.innerHTML = ''
      return
    }
    const url = `${CONFIG.memos.baseUrl}api/v1/memos?creatorId=${CONFIG.memos.creatorId}&rowStatus=NORMAL&limit=${limit}&pageToken=${encodeURIComponent(nextToken)}`
    try {
      const res = await fetch(url)
      const resdata = await res.json()
      const list = Array.isArray(resdata) ? resdata : resdata.memos || []
      nextToken = resdata?.nextPageToken || ''
      updateMemoList(list)
      const Artalk = await ensureArtalk()
      Artalk.loadCountWidget({
        server: CONFIG.artalk.server,
        site: CONFIG.artalk.site,
        countEl: '.artalk-count',
      })
    } catch (err) {
      if (loadMoreContainer)
        loadMoreContainer.innerHTML = '<div class="memo-error">加载更多失败</div>'
    }
  }

  document.addEventListener('click', (e) => {
    // placeholder
  })
  if ((window as any).__memosDocClick) {
    document.removeEventListener('click', (window as any).__memosDocClick)
  }
  const __memosDocClick = (e: Event) => {
    const t = e.target as HTMLElement
    const isBtn = !!t.closest('.memos-comments')
    const isGlobal = !!t.closest('#memos-comment-global')
    if (isBtn || isGlobal) return
    const c1 = document.getElementById('memos-comment-global')
    if (c1 && !c1.classList.contains('d-none')) {
      c1.classList.add('d-none')
      c1.innerHTML = ''
      c1.removeAttribute('data-current-id')
      ;(window as any).__memosCommentId = null
    }
  }
  document.addEventListener('click', __memosDocClick)
  ;(window as any).__memosDocClick = __memosDocClick

  function initMemos() {
    memoGrid = document.querySelector(CONFIG.dom.gridContainer)
    memoTemplate = document.querySelector(CONFIG.dom.template)
    loadMoreContainer = document.querySelector(CONFIG.dom.loadMore)
    if (!memoGrid || !memoTemplate) return
    nextToken = ''
    memoGrid.innerHTML = ''
    if (loadMoreContainer) loadMoreContainer.innerHTML = ''
    const c1 = document.getElementById('memos-comment-global')
    if (c1) {
      c1.classList.add('d-none')
      c1.innerHTML = ''
      c1.removeAttribute('data-current-id')
    }
    // @ts-ignore
    ;(window as any).__memosCommentId = null
    getFirstPageMemos()
  }

  initMemos()
}
