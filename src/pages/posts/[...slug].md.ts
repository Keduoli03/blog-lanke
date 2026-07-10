import type { APIRoute, GetStaticPaths } from 'astro'
import type { CollectionEntry } from 'astro:content'
import { getSortedPosts, getEntrySlug } from '@/utils/content'
import { formatPostMarkdown, markdownResponse } from '@/utils/post-markdown'
import { isColumnPost } from '@/utils/post-url'

export const getStaticPaths = (async () => {
  const posts = await getSortedPosts()

  return posts
    .filter((post) => !isColumnPost(post))
    .map((post) => ({
      params: { slug: getEntrySlug(post) },
      props: { post },
    }))
}) satisfies GetStaticPaths

interface Props {
  post: CollectionEntry<'posts'>
}

export const GET: APIRoute<Props> = ({ props }) => {
  return markdownResponse(formatPostMarkdown(props.post))
}
