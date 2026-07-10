interface PostEntry {
  id: string
  filePath?: string
  data?: unknown
}

export function getEntryPath(entry: Pick<PostEntry, 'id' | 'filePath'>) {
  const rawPath = String(entry.filePath ?? entry.id).replace(/\\/g, '/')
  return rawPath
    .replace(/\.(md|mdx)$/i, '')
    .replace(/^\.?\/*src\/content\/[^/]+\//i, '')
    .replace(/^\.?\/*(?:posts|spec|friends|projects)\//i, '')
}

export function getEntrySlug(entry: PostEntry) {
  const slug = (entry.data as { slug?: string | number } | undefined)?.slug
  return String(slug ?? getEntryPath(entry))
}

export function slugify(text: string) {
  return text.replace(/\./g, '').replace(/\s/g, '-').toLowerCase()
}

export function isColumnPost(entry: Pick<PostEntry, 'id' | 'filePath'>) {
  const segments = getEntryPath(entry).split('/')
  return segments.length >= 3 && (segments[0] === '专栏' || segments[0] === 'column')
}

export function getPostUrl(entry: PostEntry) {
  const entryPath = getEntryPath(entry)
  const segments = entryPath.split('/')
  if (isColumnPost(entry)) {
    return `/columns/${slugify(segments[1])}/${segments.at(-1)}`
  }
  return `/posts/${getEntrySlug(entry)}`
}
