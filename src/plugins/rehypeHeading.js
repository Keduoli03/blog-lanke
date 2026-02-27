import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

function getNodeText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  if (Array.isArray(node.children)) {
    return node.children.map(getNodeText).join('')
  }
  return ''
}

export function rehypeHeading() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.tagName === 'h1' ||
        node.tagName === 'h2' ||
        node.tagName === 'h3' ||
        node.tagName === 'h4' ||
        node.tagName === 'h5' ||
        node.tagName === 'h6'
      ) {
        const titleText = getNodeText(node).trim()
        const link = h(
          'a',
          {
            href: `#${node.properties.id}`,
            class: 'heading-anchor',
            ariaLabel: 'Heading Anchor',
          },
          h('iconify-icon', { icon: 'ri:links-line' }),
        )
        node.children.push(link)
        node.properties = {
          ...(node.properties || {}),
          class: 'heading',
          'data-title': titleText,
        }
        parent.children[index] = node
      }
      if (node.tagName === 'blockquote') {
        const quoteText = getNodeText(node).trim()
        node.properties = {
          ...(node.properties || {}),
          'data-quote': quoteText,
        }
        parent.children[index] = node
      }
    })
  }
}
