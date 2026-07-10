export function isPostPublic(data: { draft?: boolean; unlisted?: boolean }, isProd: boolean) {
  if (data.unlisted) return false
  if (isProd && data.draft) return false
  return true
}
