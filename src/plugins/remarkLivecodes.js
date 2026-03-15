import { visit } from 'unist-util-visit'

export function remarkLivecodes() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'livecodes') return

      const data = node.data || (node.data = {})
      const attrs = node.attributes || {}

      data.hName = 'div'
      data.hProperties = {
        className: ['livecodes'],
        ...(attrs.template ? { 'data-lc-template': String(attrs.template) } : {}),
        ...(attrs.height ? { 'data-lc-height': String(attrs.height) } : {}),
        ...(attrs.title ? { 'data-lc-title': String(attrs.title) } : {}),
      }
    })
  }
}
