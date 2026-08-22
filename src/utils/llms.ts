import siteConfig from '@/config.json'
import type { CollectionEntry } from 'astro:content'
import { getAllCategories, getColumnsFromFolder, getSortedPosts } from './content'
import { getPostUrl } from './post-url'

export interface LlmsBuildOptions {
  full?: boolean
  featuredLimit?: number
  optionalLimit?: number
}

function absUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl).href
}

function formatLink(title: string, url: string, note?: string) {
  const desc = note?.trim()
  return desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`
}

function postNote(post: CollectionEntry<'posts'>) {
  return post.data.summary || post.data.category || ''
}

function postMarkdownUrl(post: CollectionEntry<'posts'>, siteUrl: string) {
  return `${absUrl(getPostUrl(post), siteUrl)}.md`
}

export async function buildLlmsTxt(siteUrl: string, options: LlmsBuildOptions = {}) {
  const { full = false, featuredLimit = 10, optionalLimit = 40 } = options
  const { site, author, hero, menus } = siteConfig

  const sortedPosts = (await getSortedPosts()).filter((post) => !post.data.unlisted)
  const featuredPosts = sortedPosts.slice(0, featuredLimit)
  const featuredIds = new Set(featuredPosts.map((post) => post.id))
  const optionalPosts = sortedPosts.filter((post) => !featuredIds.has(post.id))

  const lines: string[] = []
  lines.push(`# ${site.title}`, '')
  lines.push(`> ${site.description}`, '')
  lines.push(
    '',
    `${hero.description} 作者：${author.name}。语言：${site.lang}。`,
    '',
    '本站基于 Astro 构建，面向人类读者与 LLM 提供技术笔记、博客折腾记录与生活随笔。',
    '',
  )

  lines.push('## 站点')
  for (const menu of menus) {
    lines.push(formatLink(menu.name, absUrl(menu.link, siteUrl)))
  }
  lines.push(formatLink('RSS 订阅', absUrl('/rss.xml', siteUrl), '文章更新 Feed'))
  lines.push(formatLink('站点地图', absUrl('/sitemap-index.xml', siteUrl), '完整 URL 列表'))
  if (!full) {
    lines.push(
      formatLink(
        'llms-full.txt',
        absUrl('/llms-full.txt', siteUrl),
        '包含全部公开文章的扩展版 llms.txt',
      ),
    )
  }
  lines.push('')

  lines.push('## When to use')
  lines.push('- 查询 Astro 博客搭建、部署、SEO、RSS、llms.txt 与主题定制实践。')
  lines.push('- 查询 Java、Spring Boot、MyBatis、MySQL、前端与移动端开发笔记。')
  lines.push('- 查询 Obsidian、Hermes Agent、LLM 工具链及个人知识管理经验。')
  lines.push('- 需要引用文章时，优先使用各文章的 `.md` 地址；浏览完整目录时使用 llms-full.txt。')
  lines.push('')

  if (full) {
    lines.push('## 全部文章')
    for (const post of sortedPosts) {
      lines.push(formatLink(post.data.title, postMarkdownUrl(post, siteUrl), postNote(post)))
    }
    lines.push('')
  } else {
    lines.push('## 精选文章')
    for (const post of featuredPosts) {
      lines.push(formatLink(post.data.title, postMarkdownUrl(post, siteUrl), postNote(post)))
    }
    lines.push('')
  }

  const columns = await getColumnsFromFolder()
  if (columns.length) {
    lines.push('## 专栏')
    for (const column of columns) {
      lines.push(
        formatLink(
          column.title,
          absUrl(`/columns/${column.slug}`, siteUrl),
          `${column.items.length} 篇文章`,
        ),
      )
    }
    lines.push('')
  }

  const categories = await getAllCategories()
  if (categories.length) {
    lines.push('## 分类')
    for (const category of categories.slice(0, 12)) {
      lines.push(
        formatLink(
          category.name,
          absUrl(`/categories/${category.slug}`, siteUrl),
          `${category.count} 篇`,
        ),
      )
    }
    lines.push('')
  }

  lines.push('## Optional')
  lines.push(formatLink('追番', absUrl('/bangumi', siteUrl), 'Bangumi 观影记录'))
  lines.push(formatLink('说说', absUrl('/memos', siteUrl), '短动态'))
  lines.push(formatLink('项目', absUrl('/projects', siteUrl), '个人项目展示'))
  lines.push(formatLink('联系', absUrl('/contact', siteUrl), '联系作者与反馈问题'))
  lines.push(formatLink('隐私', absUrl('/privacy', siteUrl), '隐私与第三方服务说明'))
  lines.push(formatLink('GitHub', 'https://github.com/Keduoli03', '作者开源仓库'))

  if (!full) {
    for (const post of optionalPosts.slice(0, optionalLimit)) {
      lines.push(formatLink(post.data.title, postMarkdownUrl(post, siteUrl), postNote(post)))
    }
  }

  return `${lines.join('\n').trim()}\n`
}
