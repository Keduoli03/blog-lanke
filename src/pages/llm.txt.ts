import type { APIRoute } from 'astro'
import { buildLlmsTxt } from '@/utils/llms'

/** 常见别名：部分资料写作 llm.txt，内容与 /llms.txt 一致。 */
export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href ?? import.meta.env.SITE
  const body = await buildLlmsTxt(siteUrl)

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
