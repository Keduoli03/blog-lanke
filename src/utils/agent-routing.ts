import { legacyRedirects } from '../generated/legacy-redirects'

export type AgentRouteDecision =
  { type: 'next' } | { type: 'redirect'; pathname: string } | { type: 'rewrite'; pathname: string }

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

function normalizePathname(pathname: string) {
  const decoded = decodePathname(pathname)
  if (decoded === '/') return decoded
  return decoded.replace(/\/+$/, '') || '/'
}

export function resolveAgentRoute(pathname: string, accept = ''): AgentRouteDecision {
  const normalized = normalizePathname(pathname)
  const redirect = legacyRedirects[normalized as keyof typeof legacyRedirects]
  if (redirect) return { type: 'redirect', pathname: redirect }

  if (!accept.toLowerCase().includes('text/markdown')) return { type: 'next' }
  if (normalized === '/') return { type: 'rewrite', pathname: '/llms.txt' }
  if (normalized.endsWith('.md')) return { type: 'next' }

  if (/^\/posts\/[^/]+$/.test(normalized)) {
    return { type: 'rewrite', pathname: `${normalized}.md` }
  }
  if (/^\/columns\/[^/]+\/[^/]+$/.test(normalized)) {
    return { type: 'rewrite', pathname: `${normalized}.md` }
  }

  return { type: 'next' }
}
