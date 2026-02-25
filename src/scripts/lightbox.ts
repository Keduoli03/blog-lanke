interface LightboxState {
  scale: number
  rotate: number
  translateX: number
  translateY: number
  isDragging: boolean
  startX: number
  startY: number
  index: number
  gallery: Array<{ url: string; rawAlt: string; rawTitle: string; el: Element }>
}

export class Lightbox {
  private state: LightboxState = {
    scale: 1,
    rotate: 0,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    index: -1,
    gallery: [],
  }

  private preventScroll: ((ev: Event) => void) | null = null

  // 动态获取 DOM 元素，确保页面更新后引用依然有效
  private get dialog() {
    return document.getElementById('md-lightbox-dialog') as HTMLDialogElement | null
  }
  private get img() {
    return document.getElementById('md-lightbox-img') as HTMLImageElement | null
  }
  private get caption() {
    return document.getElementById('md-lightbox-caption')
  }
  private get counter() {
    return document.getElementById('lb-counter')
  }
  private get imgContainer() {
    return document.querySelector('.lightbox-image-container') as HTMLElement | null
  }

  constructor() {
    this.init()
  }

  public init() {
    // 确保 dialog 在 body 下（某些框架可能会把它包裹在深层 div 中）
    if (this.dialog && this.dialog.parentElement !== document.body) {
      document.body.appendChild(this.dialog)
    }

    if (this.img) {
      this.img.draggable = false
      this.img.ondragstart = () => false
    }

    this.bindGlobalEvents()
  }

  private bindGlobalEvents() {
    // 使用事件委托处理所有交互，避免 DOM 更新导致事件失效
    document.addEventListener('click', this.handleDocumentClick.bind(this), { capture: true })
    window.addEventListener('keydown', this.handleKeydown.bind(this))

    // 拖拽事件绑定到 document，但在 handler 中检查 target
    // 注意：拖拽通常需要绑定在具体元素上，或者在 document 上根据 target 判断
    // 为了性能，我们可以动态绑定/解绑，或者直接在 document 上监听并判断
    // 这里采用：mousedown 时检查是否在 imgContainer 内
    document.addEventListener('mousedown', this.handleDragStart.bind(this))
    document.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false })
    window.addEventListener('mousemove', this.handleDragMove.bind(this))
    window.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false })
    window.addEventListener('mouseup', this.handleDragEnd.bind(this))
    window.addEventListener('touchend', this.handleDragEnd.bind(this))
  }

  private handleDocumentClick(e: Event) {
    const t = e.target as HTMLElement
    if (!t) return

    // 1. Lightbox Controls (Delegation)
    if (t.closest('#lb-zoom-in')) {
      e.stopPropagation()
      this.zoomIn()
      return
    }
    if (t.closest('#lb-zoom-out')) {
      e.stopPropagation()
      this.zoomOut()
      return
    }
    if (t.closest('#lb-rotate')) {
      e.stopPropagation()
      this.rotate()
      return
    }
    if (t.closest('#md-lightbox-close')) {
      e.stopPropagation()
      this.close()
      return
    }
    if (t.closest('#lb-prev')) {
      e.stopPropagation()
      this.prev()
      return
    }
    if (t.closest('#lb-next')) {
      e.stopPropagation()
      this.next()
      return
    }

    // 2. Dialog Background Click
    if (this.dialog?.open && this.dialog.contains(t)) {
      if (
        t === this.dialog ||
        t.classList.contains('lightbox-content-wrapper') ||
        t.classList.contains('lightbox-image-container')
      ) {
        this.close()
      }
      // 如果点击的是 dialog 内部其他元素（如图片本身），不关闭，也不处理打开逻辑
      return
    }

    // 3. Opening Lightbox Logic (Click on images/links in page)
    this.handleOpenClick(e, t)
  }

  private handleOpenClick(e: Event, t: HTMLElement) {
    // Global Exclusion
    const exclusion =
      t.closest('#sidebar') ||
      t.closest('.sidebar-header') ||
      t.closest('.sidebar-logo') ||
      t.closest('#comment-section') ||
      t.closest('.artalk') ||
      t.closest('.mobile-nav') ||
      t.closest('#mobile-navbar') ||
      t.closest('.md-lightbox-exclude') ||
      t.closest('pre') ||
      t.closest('code')

    if (exclusion) return

    let targetEl: Element | null = null
    const a = t.closest('a')
    if (a && this.isLightboxLink(a)) {
      targetEl = a
    } else {
      const imgEl = t.closest('img')
      if (imgEl && this.isValidImage(imgEl)) {
        targetEl = imgEl
      }
    }

    if (targetEl) {
      e.preventDefault()
      e.stopPropagation()
      this.openAt(targetEl)
    }
  }

  private isValidImage(imgEl: HTMLImageElement): boolean {
    const altLower = (imgEl.getAttribute('alt') || '').toLowerCase()
    const isEmoji =
      imgEl.classList.contains('artalk-emoji') ||
      imgEl.classList.contains('atk-emoji') ||
      imgEl.hasAttribute('data-emoji') ||
      /emoji|表情/.test(altLower)
    const isUiIcon =
      /logo|icon|avatar|徽标|图标/.test(altLower) ||
      imgEl.classList.contains('logo') ||
      imgEl.classList.contains('icon') ||
      imgEl.classList.contains('avatar')

    return (
      !isEmoji &&
      !isUiIcon &&
      !imgEl.hasAttribute('data-no-lightbox') &&
      !imgEl.classList.contains('no-lightbox') &&
      !imgEl.closest('pre') &&
      !imgEl.closest('code')
    )
  }

  private isLightboxLink(a: Element): boolean {
    const target = a.getAttribute('target')
    const rel = (a.getAttribute('rel') || '').toLowerCase()
    if (target === '_blank' || rel.includes('noopener') || rel.includes('noreferrer')) return false
    if (a.getAttribute('data-no-lightbox') === 'true') return false

    if (
      a.closest('#sidebar') ||
      a.closest('.sidebar-header') ||
      a.closest('.mobile-nav') ||
      a.closest('.md-lightbox-exclude')
    )
      return false

    const href = a.getAttribute('href') || ''
    const classes = a.classList
    const hasData = a.hasAttribute('data-lightbox') || a.hasAttribute('data-pswp-src')
    const isImageHref = /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(href)

    return (
      hasData ||
      classes.contains('md-lightbox') ||
      classes.contains('pswp-link') ||
      classes.contains('post-image-link') ||
      isImageHref
    )
  }

  private handleKeydown(e: KeyboardEvent) {
    if (!this.dialog?.open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      this.close()
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.prev()
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.next()
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      this.zoomIn()
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      this.zoomOut()
    }
  }

  private openAt(targetEl: Element) {
    this.state.gallery = this.buildGallery()
    let index = -1

    index = this.state.gallery.findIndex((item) => item.el === targetEl)

    if (index === -1 && targetEl.tagName === 'IMG') {
      const parentA = targetEl.closest('a')
      if (parentA) {
        index = this.state.gallery.findIndex((item) => item.el === parentA)
      }
    }

    if (index === -1) {
      const info = this.getLightboxInfo(targetEl)
      if (info.url) {
        this.state.gallery = [info]
        index = 0
      }
    }

    if (index !== -1) {
      this.state.index = index
      this.updateImageContent()

      if (this.dialog) {
        if (typeof this.dialog.showModal === 'function') this.dialog.showModal()
        else this.dialog.setAttribute('open', '')
      }
      this.lockScroll()
    }
  }

  private buildGallery() {
    const candidates = document.querySelectorAll('a, img')
    const gallery: Array<{ url: string; rawAlt: string; rawTitle: string; el: Element }> = []
    const seen = new Set()

    candidates.forEach((el) => {
      if (
        el.closest('#comment-section') ||
        el.closest('.artalk') ||
        el.closest('.atk-layer-wrap') ||
        el.closest('.atk-layer-dialog-wrap') ||
        el.closest('#sidebar') ||
        el.closest('.sidebar-header') ||
        el.closest('.mobile-nav') ||
        el.closest('#mobile-navbar') ||
        el.closest('.md-lightbox-exclude') ||
        el.classList.contains('atk-captcha-img')
      )
        return

      if (seen.has(el)) return

      let info = null
      if (el.tagName === 'A' && this.isLightboxLink(el)) {
        info = this.getLightboxInfo(el)
        const childImg = el.querySelector('img')
        if (childImg) seen.add(childImg)
      } else if (el.tagName === 'IMG') {
        const parentA = el.closest('a')
        if (parentA && this.isLightboxLink(parentA)) return

        if (this.isValidImage(el as HTMLImageElement)) {
          info = this.getLightboxInfo(el)
        }
      }

      if (info && info.url) {
        gallery.push(info)
        seen.add(el)
      }
    })
    return gallery
  }

  private getLightboxInfo(el: Element) {
    let url = '',
      rawAlt = '',
      rawTitle = ''

    if (el.tagName === 'A') {
      const childImg = el.querySelector('img')
      let attrUrl =
        el.getAttribute('data-original-src') ||
        el.getAttribute('data-pswp-src') ||
        el.getAttribute('data-lightbox') ||
        el.getAttribute('href')

      if (childImg) {
        const isAbsolute =
          attrUrl && (/^(?:[a-z]+:)?\/\//i.test(attrUrl) || attrUrl.startsWith('/'))
        if (attrUrl && isAbsolute) {
          url = attrUrl
        } else {
          if (childImg.srcset) {
            const candidates = childImg.srcset.split(',').map((s) => {
              const parts = s.trim().split(/\s+/)
              const src = parts[0]
              let score = 0
              for (let i = 1; i < parts.length; i++) {
                const part = parts[i]
                if (part.endsWith('w')) {
                  score = parseInt(part)
                  break
                } else if (part.endsWith('x')) {
                  score = parseFloat(part) * 1000
                  break
                }
              }
              return { src, score }
            })
            candidates.sort((a, b) => b.score - a.score)
            if (candidates.length > 0) url = candidates[0].src
          }
          if (!url) {
            url = childImg.currentSrc || childImg.src || attrUrl || ''
          }
        }
        rawAlt = el.getAttribute('data-alt') || childImg.getAttribute('alt') || ''
        rawTitle = el.getAttribute('data-title') || childImg.getAttribute('title') || ''
      } else {
        url = attrUrl || ''
        rawAlt = el.getAttribute('data-alt') || ''
        rawTitle = el.getAttribute('data-title') || ''
      }
    } else if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      url =
        el.getAttribute('data-original-src') ||
        el.getAttribute('data-pswp-src') ||
        img.currentSrc ||
        img.src ||
        ''
      rawAlt = el.getAttribute('alt') || ''
      rawTitle = el.getAttribute('title') || ''
    }
    return { url, rawAlt, rawTitle, el }
  }

  private updateImageContent() {
    if (this.state.index < 0 || this.state.index >= this.state.gallery.length) return
    const item = this.state.gallery[this.state.index]
    const alt = this.sanitizeCaption(item.rawAlt)
    const title = this.sanitizeCaption(item.rawTitle)
    const captionText = title || alt || ''

    if (this.img) {
      this.img.src = item.url
      this.img.alt = alt

      this.img.removeAttribute('width')
      this.img.removeAttribute('height')
      this.img.removeAttribute('style')
      this.img.style.transform = `translate(0px, 0px) scale(1) rotate(0deg)`
      this.img.style.cursor = 'grab'

      this.state.scale = 1
      this.state.rotate = 0
      this.state.translateX = 0
      this.state.translateY = 0
      this.updateTransform()
    }

    if (this.caption) {
      this.caption.textContent = captionText
      this.caption.style.display = captionText ? 'block' : 'none'
    }

    if (this.counter) {
      this.counter.textContent = `${this.state.index + 1} / ${this.state.gallery.length}`
    }

    const btnPrev = document.getElementById('lb-prev')
    const btnNext = document.getElementById('lb-next')
    if (btnPrev) {
      btnPrev.style.display = this.state.gallery.length > 1 ? 'flex' : 'none'
      btnPrev.style.opacity = this.state.gallery.length > 1 ? '1' : '0.5'
    }
    if (btnNext) {
      btnNext.style.display = this.state.gallery.length > 1 ? 'flex' : 'none'
      btnNext.style.opacity = this.state.gallery.length > 1 ? '1' : '0.5'
    }
  }

  private sanitizeCaption(text: string) {
    const s = (text || '').trim()
    if (!s) return ''
    if (/^\|\s*\d+(\s*x\s*\d+)?\s*$/i.test(s)) return ''
    return s.replace(/\|\s*\d+(\s*x\s*\d+)?\s*$/i, '').trim()
  }

  private updateTransform() {
    if (this.img) {
      this.img.style.transform = `translate(${this.state.translateX}px, ${this.state.translateY}px) scale(${this.state.scale}) rotate(${this.state.rotate}deg)`
      this.img.style.cursor =
        this.state.scale > 1 ? (this.state.isDragging ? 'grabbing' : 'grab') : 'zoom-in'
    }
  }

  private next() {
    if (this.state.gallery.length <= 1) return
    this.state.index = (this.state.index + 1) % this.state.gallery.length
    this.updateImageContent()
  }

  private prev() {
    if (this.state.gallery.length <= 1) return
    this.state.index =
      (this.state.index - 1 + this.state.gallery.length) % this.state.gallery.length
    this.updateImageContent()
  }

  private zoomIn() {
    this.state.scale = Math.min(this.state.scale + 0.25, 5)
    this.updateTransform()
  }

  private zoomOut() {
    this.state.scale = Math.max(this.state.scale - 0.25, 0.1)
    this.updateTransform()
  }

  private rotate() {
    this.state.rotate = (this.state.rotate + 90) % 360
    this.updateTransform()
  }

  private close() {
    if (this.dialog) {
      if (typeof this.dialog.close === 'function') this.dialog.close()
      else this.dialog.removeAttribute('open')
    }
    if (this.img) {
      this.img.src = ''
      this.img.removeAttribute('src')
      this.img.alt = ''
    }
    this.unlockScroll()
  }

  // Dragging
  private handleDragStart(e: MouseEvent | TouchEvent) {
    // 检查是否在图片容器内
    const target = e.target as HTMLElement
    if (!this.imgContainer || !this.imgContainer.contains(target)) return

    if (this.state.scale <= 1) return
    this.state.isDragging = true
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY
    this.state.startX = clientX - this.state.translateX
    this.state.startY = clientY - this.state.translateY
    if (this.img) this.img.style.cursor = 'grabbing'
    e.preventDefault()
  }

  private handleDragMove(e: MouseEvent | TouchEvent) {
    if (!this.state.isDragging) return
    e.preventDefault()
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY
    this.state.translateX = clientX - this.state.startX
    this.state.translateY = clientY - this.state.startY
    this.updateTransform()
  }

  private handleDragEnd() {
    this.state.isDragging = false
    if (this.img) {
      this.img.style.cursor = this.state.scale > 1 ? 'grab' : 'zoom-in'
    }
  }

  private lockScroll() {
    document.documentElement.classList.add('lightbox-open')
    this.preventScroll = (ev: Event) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation()
    }
    window.addEventListener('wheel', this.preventScroll, { passive: false, capture: true })
    window.addEventListener('touchmove', this.preventScroll, { passive: false, capture: true })
  }

  private unlockScroll() {
    document.documentElement.classList.remove('lightbox-open')
    if (this.preventScroll) {
      window.removeEventListener('wheel', this.preventScroll, { capture: true })
      window.removeEventListener('touchmove', this.preventScroll, { capture: true })
      this.preventScroll = null
    }
  }
}

// Auto-initialize (Singleton)
let lightboxInstance: Lightbox | null = null
if (typeof window !== 'undefined') {
  if (!lightboxInstance) {
    lightboxInstance = new Lightbox()
  }

  // Re-init on page transitions (if needed to re-attach dialog to body)
  const reinit = () => lightboxInstance?.init()
  document.addEventListener('astro:page-load', reinit)
  document.addEventListener('swup:contentReplaced', reinit)
}
