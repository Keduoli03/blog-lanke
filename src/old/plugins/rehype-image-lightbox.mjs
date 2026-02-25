import { visit } from 'unist-util-visit'

export default function rehypeImageLightbox() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || node.tagName !== 'img') return

      const props = node.properties || {}
      let src = String(props.src || '')
      let alt = String(props.alt || '')
      let title = String(props.title || '')

      // DEBUG: 注入调试信息到 DOM，以便在生产环境排查
      // props['data-debug-alt-raw'] = alt;

      let width = props['data-md-width']
      let height = props['data-md-height']

      // Fallback: 如果 remark 插件未处理，尝试在 rehype 阶段解析 alt 中的尺寸
      if (!width && !height) {
        // 匹配 "text|100" 或 "text | 100" 等，允许空格，兼容中文管道符和乘号
        // 增强正则：兼容 HTML 实体管道符 (&#124;) 和非中断空格
        // const match = alt.match(/^(.*?)\s*[|｜]\s*(\d+)(?:\s*[xX×]\s*(\d+))?\s*$/);

        // 尝试先解码 HTML 实体（简单的替换，避免引入 heavy library）
        const decodedAlt = alt
          .replace(/&#124;/g, '|')
          .replace(/&vert;/g, '|')
          .replace(/&#x7C;/g, '|')

        const match = decodedAlt.match(
          /^(.*?)(?:[\s\u00A0]*[|｜][\s\u00A0]*)(\d+)(?:[\s\u00A0]*[xX×][\s\u00A0]*(\d+))?[\s\u00A0]*$/,
        )

        if (match) {
          const [_, cleanAlt, w, h] = match
          alt = cleanAlt.trim()
          width = w
          height = h

          // props['data-debug-fallback'] = 'triggered';

          // 更新 img 节点的 alt，避免显示管道符
          props.alt = alt
        }
      }

      if (width) {
        const w = width
        const currentStyle = props.style || ''

        // 设置 CSS 样式强制控制显示宽度，并添加 margin: 0 auto 实现居中
        // 注意：max-width 设为 100% 以保证移动端不溢出
        props.style = `width: ${w}px !important; max-width: 100% !important; display: block; margin: 0 auto; ${currentStyle}`

        // 对于这种强制指定宽度的网络图片，我们可以保留 sizes="100vw" 以确保清晰度
        if (!props.sizes) props.sizes = '100vw'

        // 清理临时属性
        delete props['data-md-width']
      }

      if (height) {
        const h = height
        const currentStyle = props.style || ''
        // 同样为高度限制的图片添加居中
        props.style = `height: ${h}px !important; display: block; margin: 0 auto; ${currentStyle}`
        delete props['data-md-height']
      }

      // 如果已经有 <a> 包裹，只增强属性，避免覆盖原本的 href
      if (parent.tagName === 'a') {
        parent.properties = parent.properties || {}
        const cls = parent.properties.className || []
        parent.properties.className = Array.isArray(cls)
          ? [...new Set([...cls, 'md-lightbox'])]
          : ['md-lightbox']
        // 不再覆盖 href，保留原链接
        parent.properties['data-lightbox'] = parent.properties['data-lightbox'] || src

        // 关键修复：更新父级 <a> 标签的 data-alt 为处理后的 alt（不带管道符）
        parent.properties['data-alt'] = alt

        parent.properties['data-title'] = title
        // 禁用 Astro 预取，避免视口预取造成 404
        parent.properties['data-astro-prefetch'] = 'false'
        // 可访问性增强
        parent.properties.role = parent.properties.role || 'button'
        parent.properties.tabIndex = parent.properties.tabIndex ?? 0
        return
      }

      // 没有外层链接时，创建一个用于灯箱的 <a>
      const anchor = {
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['md-lightbox'],
          href: '#', // 避免预取错误，同时点击由脚本接管
          // 'data-lightbox': src, // 移除：让前端根据 img 标签自动探测最佳画质（优先 srcset）
          'data-alt': alt,
          'data-title': title,
          // 禁用 Astro 预取
          'data-astro-prefetch': 'false',
          // 可访问性
          role: 'button',
          tabIndex: 0,
        },
        children: [node],
      }

      parent.children[index] = anchor
    })
  }
}
