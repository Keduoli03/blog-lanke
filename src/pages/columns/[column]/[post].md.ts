import type { APIRoute, GetStaticPaths } from 'astro'
import type { CollectionEntry } from 'astro:content'
import { getColumnsFromFolder, getEntryPath, getPublicPosts } from '@/utils/content'
import { formatPostMarkdown, markdownResponse } from '@/utils/post-markdown'

export const getStaticPaths = (async () => {
  const columns = await getColumnsFromFolder()
  const posts = await getPublicPosts()
  const postsByPath = new Map(posts.map((entry) => [getEntryPath(entry), entry]))
  const paths: {
    params: { column: string; post: string }
    props: { post: CollectionEntry<'posts'> }
  }[] = []

  for (const column of columns) {
    for (const item of column.items) {
      const post = postsByPath.get(item.slug)
      if (!post) continue
      paths.push({
        params: { column: column.slug, post: item.slug.split('/').pop()! },
        props: { post },
      })
    }
  }

  return paths
}) satisfies GetStaticPaths

interface Props {
  post: CollectionEntry<'posts'>
}

export const GET: APIRoute<Props> = ({ props }) => {
  return markdownResponse(formatPostMarkdown(props.post))
}
