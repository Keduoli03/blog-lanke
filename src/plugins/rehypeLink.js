import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

export function rehypeLink() {
  return (tree) => {
    visit(tree, { tagName: 'a' }, (node, index, parent) => {
      const href = node.properties?.href
      if (typeof href !== 'string') return
      const isExternal = href.startsWith('http')
      if (isExternal) {
        node.properties = {
          ...node.properties,
          rel: 'noopener noreferrer',
          target: '_blank',
        }
        parent.children[index] = node
        const icon = h('iconify-icon', { icon: 'ri:external-link-line' })
        parent.children.splice(index + 1, 0, icon)
      }
    })
  }
}
