import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { site } from '@/config.json'
import { getSortedPosts } from '@/utils/content'

export async function GET(context: APIContext) {
  const sortedPosts = await getSortedPosts()
  const filteredPosts = sortedPosts.filter((post) => !post.data.unlisted)

  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: filteredPosts.map((post) => ({
      link: `/posts/${post.slug}`,
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
    })),
    customData: `<language>${site.lang}</language>`,
  })
}
