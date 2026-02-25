import { getCollection } from 'astro:content'

// 获取所有文章
async function getAllPosts() {
  const allPosts = await getCollection('posts', ({ data }) => {
    // 1. 在生产环境过滤草稿 (draft: true)
    if (import.meta.env.PROD && data.draft) {
      return false
    }
    // 2. 过滤未列出文章 (unlisted: true)
    // 注意：unlisted 文章不应出现在列表（首页、归档、RSS），但可以通过链接直接访问
    // 如果 getAllPosts 用于生成列表，则应过滤。
    // 但如果用于生成静态路径（getStaticPaths），则不能过滤 unlisted，否则无法生成页面。
    // 通常 getAllPosts 被用于列表展示，所以这里过滤 unlisted 是合理的。
    // 但为了生成页面，我们需要另一个函数或者参数控制。

    // 修正：Astro 的 getCollection 默认用于生成页面和列表。
    // 如果我们在这里过滤了 unlisted，那么 unlisted 的文章将无法生成静态页面（404）。
    // 所以，getAllPosts 应该包含 unlisted，但在展示列表（如首页、归档）时再过滤。

    // 但是，用户需求是 "不想让他们在这里（首页和归档）显示"。
    // 所以我们需要区分 "所有存在的文章" 和 "所有展示的文章"。

    return true
  })

  return allPosts
}

// 获取所有公开展示的文章（过滤 draft 和 unlisted）
export async function getPublicPosts() {
  const allPosts = await getCollection('posts', ({ data }) => {
    // 生产环境过滤草稿
    if (import.meta.env.PROD && data.draft) return false
    // 始终过滤 unlisted
    if (data.unlisted) return false
    return true
  })
  return allPosts
}

// 获取所有文章，发布日期升序
async function getNewestPosts() {
  // 使用 getPublicPosts 替代 getAllPosts，确保列表只包含公开文章
  const allPosts = await getPublicPosts()

  return allPosts.sort((a, b) => {
    return (a.data.date as Date).valueOf() - (b.data.date as Date).valueOf()
  })
}

// 获取所有文章，发布日期降序
export async function getOldestPosts() {
  const allPosts = await getPublicPosts()

  return allPosts.sort((a, b) => {
    return (b.data.date as Date).valueOf() - (a.data.date as Date).valueOf()
  })
}

// 获取所有文章，置顶优先，发布日期降序
export async function getSortedPosts() {
  const allPosts = await getPublicPosts()

  return allPosts.sort((a, b) => {
    if (a.data.sticky !== b.data.sticky) {
      return b.data.sticky - a.data.sticky
    } else {
      return (b.data.date as Date).valueOf() - (a.data.date as Date).valueOf()
    }
  })
}

// 获取所有文章的字数
export async function getAllPostsWordCount() {
  // 字数统计通常只统计公开文章
  const allPosts = await getPublicPosts()

  const promises = allPosts.map((post) => {
    return post.render()
  })

  const res = await Promise.all(promises)

  const wordCount = res.reduce((count, cur) => {
    return count + cur.remarkPluginFrontmatter.words
  }, 0)

  return wordCount
}

// 转换为 URL 安全的 slug，删除点，空格转为短横线，大写转为小写
export function slugify(text: string) {
  return text.replace(/\./g, '').replace(/\s/g, '-').toLowerCase()
}

// 获取所有分类
export async function getAllCategories() {
  const newestPosts = await getNewestPosts()

  const allCategories = newestPosts.reduce<{ slug: string; name: string; count: number }[]>(
    (acc, cur) => {
      if (cur.data.category) {
        const slug = slugify(cur.data.category)
        const index = acc.findIndex((category) => category.slug === slug)
        if (index === -1) {
          acc.push({
            slug,
            name: cur.data.category,
            count: 1,
          })
        } else {
          acc[index].count += 1
        }
      }
      return acc
    },
    [],
  )

  return allCategories
}

// 获取所有标签
export async function getAllTags() {
  const newestPosts = await getNewestPosts()

  const allTags = newestPosts.reduce<{ slug: string; name: string; count: number }[]>(
    (acc, cur) => {
      cur.data.tags.forEach((tag) => {
        const slug = slugify(tag)
        const index = acc.findIndex((tag) => tag.slug === slug)
        if (index === -1) {
          acc.push({
            slug,
            name: tag,
            count: 1,
          })
        } else {
          acc[index].count += 1
        }
      })
      return acc
    },
    [],
  )

  return allTags
}

// 获取热门标签
export async function getHotTags(len = 5) {
  const allTags = await getAllTags()

  return allTags
    .sort((a, b) => {
      return b.count - a.count
    })
    .slice(0, len)
}

// 根据 posts 子目录（如 “专栏” 或 “column”）自动构建专栏与分栏目录
export async function getColumnsFromFolder(folderNames: string[] = ['专栏', 'column']) {
  const all = await getAllPosts()
  type Item = { slug: string; title: string; index?: string; level: number }
  type Column = { slug: string; title: string; base: string; items: Item[] }
  const map = new Map<string, Column>()
  const parseIndex = (idx?: string) =>
    idx
      ? idx
          .split('.')
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n))
      : []
  for (const p of all) {
    const id = p.id // e.g. "专栏/Java/控制反转….md"
    const segs = id.split('/')
    if (segs.length < 2) continue
    const root = segs[0]
    if (!folderNames.includes(root)) continue
    const colTitle = segs[1] // e.g. "Java"
    const base = `${root}/${colTitle}` // e.g. "专栏/Java"
    const colSlug = slugify(colTitle)
    if (!map.has(base)) {
      map.set(base, { slug: colSlug, title: colTitle, base, items: [] })
    }
    const col = map.get(base)!
    col.items.push({
      slug: p.slug,
      title: p.data.title,
      index: (p.data as any).index,
      level: (p.data as any).index ? String((p.data as any).index).split('.').length : 1,
    })
  }
  // 专栏内文章按日期升序
  const res = Array.from(map.values()).map((c) => {
    c.items = c.items.sort((a, b) => {
      // 按 index 自定义顺序（1 < 1.1 < 1.1.1 < 2 ...），未设置的排在最后
      const ai = parseIndex((all.find((e) => e.slug === a.slug)?.data as any)?.index)
      const bi = parseIndex((all.find((e) => e.slug === b.slug)?.data as any)?.index)
      const len = Math.max(ai.length, bi.length)
      for (let i = 0; i < len; i++) {
        // 缺失位视为 0，确保 1 在 1.1 之前
        const av = ai[i] ?? 0
        const bv = bi[i] ?? 0
        if (av !== bv) return av - bv
      }
      // 其次按日期升序
      const pa = all.find((e) => e.slug === a.slug)!
      const pb = all.find((e) => e.slug === b.slug)!
      return (pa.data.date as Date).valueOf() - (pb.data.date as Date).valueOf()
    })
    return c
  })
  // 专栏按标题排序
  res.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  return res
}
