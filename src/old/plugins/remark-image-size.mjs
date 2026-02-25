import { visit } from 'unist-util-visit'
//适配obsidian的图片尺寸写法 ![22|600](https://gcore.jsdelivr.net/gh/Keduoli03/My_img@main/image/%E4%B9%8C%E8%B4%BC.webp)
export function remarkImageSize() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      const alt = node.alt || ''

      const match = alt.match(/^(.*?)\s*[|｜]\s*(\d+)(?:\s*[xX×]\s*(\d+))?\s*$/)

      console.log(`[RemarkImageSize] Visiting image: "${alt}"`)

      if (match) {
        const [_, cleanAlt, width, height] = match
        console.log(`[RemarkImageSize] MATCHED: "${alt}" -> w=${width}, h=${height}`)

        // 1. 使用正则判断是否为网络图片
        const isRemote = /^(https?:|\/\/)/i.test(node.url)

        // 还原 alt
        node.alt = cleanAlt.trim()

        // 策略 V12：本地图片 CSS 样式缩放方案
        // 目标：支持 |200 语法，缩小显示，但保留高清原图（不触发 Astro 物理压缩）

        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}

        // 无论是本地还是网络图片，都使用 data-md-width 传递给 rehype 处理样式
        // rehype-image-lightbox 会将其转换为 style="width: ...; margin: 0 auto;"
        if (width) node.data.hProperties['data-md-width'] = width
        if (height) node.data.hProperties['data-md-height'] = height

        // 关键：显式删除 width/height 物理属性
        // 只要没有这两个属性，Astro 就不会去压缩图片分辨率
        delete node.data.hProperties.width
        delete node.data.hProperties.height
        // @ts-ignore
        delete node.width
        // @ts-ignore
        delete node.height

        // 强制确保 hProperties 存在
        if (!node.data.hProperties) node.data.hProperties = {}
      }
    })
  }
}
