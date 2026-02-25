import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

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
          ...node.properties,
          class: 'heading',
        }
        parent.children[index] = node
      }
    })
  }
}
