import { visit } from 'unist-util-visit'

export function remarkImageSize() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      const alt = node.alt || ''
      const title = node.title || ''
      const m1 = alt.match(/^(.*?)\s*[|｜]\s*(\d+)(?:\s*[xX×]\s*(\d+))?\s*$/)
      const m2 = title && title.match(/^\s*(\d+)(?:\s*[xX×]\s*(\d+))?\s*$/)

      let cleanAlt = alt
      let w, h

      if (m1) {
        cleanAlt = m1[1]
        w = m1[2]
        h = m1[3]
      } else if (m2) {
        w = m2[1]
        h = m2[2]
      } else {
        return
      }
      node.alt = String(cleanAlt).trim()
      node.data ||= {}
      node.data.hProperties ||= {}
      if (w) node.data.hProperties['data-md-width'] = String(w)
      if (h) node.data.hProperties['data-md-height'] = String(h)
      const styles = []
      if (w) styles.push(`width:${w}px !important`, 'max-width:100% !important')
      if (h) styles.push(`height:${h}px !important`)
      if (w && !h) styles.push('height:auto !important')
      styles.push('display:block', 'margin:0 auto')
      const prev = node.data.hProperties.style ? String(node.data.hProperties.style) : ''
      const next = styles.join(';')
      node.data.hProperties.style = prev ? `${prev};${next}` : next
      delete node.data.hProperties.width
      delete node.data.hProperties.height
      delete node.width
      delete node.height
      // 清理 title 中的尺寸标记，避免渲染为 figcaption
      if (m2) node.title = ''
    })
  }
}
