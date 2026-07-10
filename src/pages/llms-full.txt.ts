import type { APIRoute } from 'astro'
import { buildLlmsTxt } from '@/utils/llms'

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href ?? import.meta.env.SITE
  const body = await buildLlmsTxt(siteUrl, { full: true })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
