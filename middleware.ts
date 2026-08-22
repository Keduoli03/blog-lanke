import { next, rewrite } from '@vercel/functions'
import { resolveAgentRoute } from './src/utils/agent-routing'

const varyHeaders = { Vary: 'Accept, Accept-Encoding' }

export default function middleware(request: Request) {
  const requestUrl = new URL(request.url)
  const decision = resolveAgentRoute(requestUrl.pathname, request.headers.get('accept') || '')

  if (decision.type === 'redirect') {
    return new Response(null, {
      status: 308,
      headers: {
        ...varyHeaders,
        Location: new URL(decision.pathname, requestUrl).href,
      },
    })
  }

  if (decision.type === 'rewrite') {
    requestUrl.pathname = decision.pathname
    return rewrite(requestUrl, { headers: varyHeaders })
  }

  return next({ headers: varyHeaders })
}

export const config = {
  matcher: ['/', '/posts/:path*', '/columns/:path*'],
  runtime: 'edge',
}
