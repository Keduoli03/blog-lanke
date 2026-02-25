import type { APIRoute } from 'astro'
import { getColumnsFromFolder } from '@/utils/content'

export const GET: APIRoute = async () => {
  const columns = await getColumnsFromFolder()
  const data = columns.map((c) => ({
    slug: c.items.length > 0 ? `${c.slug}/${c.items[0].slug.split('/').pop()}` : c.slug,
    title: c.title,
    count: c.items.length,
  }))
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  })
}
