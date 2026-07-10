import { getPostUrl, isColumnPost } from './post-url'

type PostEntry = {
  id: string
  filePath?: string
  data?: unknown
}

export function getPostRouteProps<T extends PostEntry>(current: T, prev?: T, next?: T) {
  if (isColumnPost(current)) return { redirect: getPostUrl(current) }

  return {
    current,
    ...(prev ? { prev } : {}),
    ...(next ? { next } : {}),
  }
}
