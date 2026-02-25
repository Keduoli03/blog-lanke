import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

export function rehypeImage() {
  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'p' && node.children.length === 1) {
        const child = node.children[0]
        if (child.tagName === 'img') {
          parent.children[index] = buildFigure(child)
        }
      } else if (node.tagName === 'img') {
        parent.children[index] = buildImage(node)
      }
    })
  }
}

function buildImage(node) {
  const imgProps = { ...node.properties }

  // Save original src for Lightbox to use full resolution
  if (imgProps.src) {
    imgProps['data-original-src'] = imgProps.src
  }

  let width = imgProps['data-md-width']
  let height = imgProps['data-md-height']
  // Fallback: parse from alt like "标题 | 600" or "标题 | 600x300"
  if (!width && !height && typeof imgProps.alt === 'string') {
    const m = imgProps.alt.match(/^(.*?)\s*[|｜]\s*(\d+)(?:\s*[xX×]\s*(\d+))?\s*$/)
    if (m) {
      imgProps.alt = m[1].trim()
      width = m[2]
      height = m[3]
    }
  }
  let style = imgProps.style ? String(imgProps.style) : ''
  const rules = []
  if (width) rules.push(`width:${width}px`, 'max-width:100%')
  if (height) rules.push(`height:${height}px`)
  if (width && !height) rules.push('height:auto')
  if (rules.length) {
    style = style ? `${style};${rules.join(';')}` : rules.join(';')
  }
  if (style) imgProps.style = style
  // Do NOT set HTML width/height attributes to avoid Astro optimizing it to a small size.
  // We want the full resolution image available for Lightbox, while scaling it down visually with CSS.
  // if (width) imgProps.width = String(width)
  // if (height) imgProps.height = String(height)

  return h('img', { ...imgProps, loading: 'lazy' })
}

function buildFigure(node) {
  const imgProps = { ...node.properties }
  let width = imgProps['data-md-width']
  let height = imgProps['data-md-height']
  if (!width && !height && typeof imgProps.alt === 'string') {
    const m = imgProps.alt.match(/^(.*?)\s*[|｜]\s*(\d+)(?:\s*[xX×]\s*(\d+))?\s*$/)
    if (m) {
      imgProps.alt = m[1].trim()
      width = m[2]
      height = m[3]
      node.properties.alt = imgProps.alt
      node.properties['data-md-width'] = width
      if (height) node.properties['data-md-height'] = height
    }
  }
  let figStyle = ''
  const rules = []
  if (width) rules.push(`width:${width}px`, 'max-width:100%')
  if (rules.length) rules.push('margin-left:auto', 'margin-right:auto')
  if (rules.length) figStyle = rules.join(';')
  let imgTitle = node.properties.title
  if (imgTitle) imgTitle = imgTitle.trim()
  const figureProps = figStyle ? { style: figStyle } : null
  return h('figure', figureProps, [buildImage(node), imgTitle ? h('figcaption', imgTitle) : null])
}
