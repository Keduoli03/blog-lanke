import { visit } from 'unist-util-visit'

/**
 * 自定义插件：预处理 - 如果代码块没有标题，则使用语言名称作为标题
 * 这将触发 pluginFileIcons 显示对应语言的图标
 * @returns {import('astro-expressive-code').AstroExpressiveCodeOptions['plugins'][0]}
 */
export function pluginAutoTitleSetup() {
  return {
    name: 'Auto Title Setup',
    hooks: {
      preprocessMetadata: ({ codeBlock }) => {
        if (!codeBlock.props.title && codeBlock.language) {
          codeBlock.props.title = codeBlock.language
          codeBlock.props.isAutoTitle = true
        }
      },
    },
  }
}

/**
 * 自定义插件：后处理 - 移除自动生成的标题文本，只保留图标
 * 必须放在 pluginFileIcons 之后执行
 * @returns {import('astro-expressive-code').AstroExpressiveCodeOptions['plugins'][0]}
 */
export function pluginAutoTitleCleanup() {
  return {
    name: 'Auto Title Cleanup',
    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        if (codeBlock.props.isAutoTitle) {
          visit(renderData.blockAst, 'element', (node) => {
            // 查找 class="title" 的元素
            if (
              node.properties &&
              Array.isArray(node.properties.className) &&
              node.properties.className.includes('title')
            ) {
              // 只保留 Element 节点（如图标），移除 Text 节点（如语言名称）
              // 这样可以避免显示冗余的语言文字
              node.children = node.children.filter((child) => child.type !== 'text')
            }
          })
        }
      },
    },
  }
}
