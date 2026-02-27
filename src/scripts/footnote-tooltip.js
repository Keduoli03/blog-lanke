// 脚注悬浮提示功能
let isInitialized = false
let tooltip = null

export function initFootnoteTooltip() {
  if (isInitialized) return

  tooltip = document.createElement('div')
  tooltip.className = 'footnote-tooltip'
  document.body.appendChild(tooltip)

  isInitialized = true
  let activeRef = null

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(
      '.footnote-ref, sup > a[href^="#fn"], sup > a[href^="#user-content-fn"]',
    )
    if (!target) {
      if (activeRef && !e.target.closest('.footnote-tooltip')) {
        hideTooltip()
      }
      return
    }

    activeRef = target
    const href = target.getAttribute('href')
    const id = href.slice(1) // 去掉 #
    const footnoteItem = document.getElementById(id)

    if (footnoteItem) {
      // 复制脚注内容，移除回退链接
      const content = footnoteItem.cloneNode(true)
      const backLink = content.querySelector('.data-footnote-backref')
      if (backLink) backLink.remove()

      // 处理内容，通常是 p 标签，直接取 innerHTML
      // 如果有多个 p 标签，取所有内容
      let html = ''
      const pTags = content.querySelectorAll('p')
      if (pTags.length > 0) {
        pTags.forEach((p) => (html += p.innerHTML))
      } else {
        html = content.innerHTML
      }

      tooltip.innerHTML = html
      showTooltip(target)
    }
  })

  function showTooltip(target) {
    const rect = target.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()

    // 计算位置：默认在上方
    let top = rect.top - tooltipRect.height - 10
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2

    // 边界检查
    if (top < 10) {
      // 上方空间不足，显示在下方
      top = rect.bottom + 10
    }
    if (left < 10) left = 10
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10
    }

    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
    tooltip.classList.add('show')
  }

  function hideTooltip() {
    tooltip.classList.remove('show')
    activeRef = null
  }
}
