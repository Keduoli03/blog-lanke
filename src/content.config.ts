import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const DEFAULT_TIMEZONE_OFFSET = '+08:00'

function parseFrontmatterDate(input: string): Date | undefined {
  const s = input.trim()
  if (!s) return undefined

  if (/[zZ]$|[+\-]\d{2}:\d{2}$/.test(s)) {
    const withT = s.includes('T') ? s : s.replace(' ', 'T')
    const d = new Date(withT)
    return isNaN(d.valueOf()) ? undefined : d
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00${DEFAULT_TIMEZONE_OFFSET}`)
    return isNaN(d.valueOf()) ? undefined : d
  }

  const normalized = s.includes('T') ? s : s.replace(' ', 'T')
  const d = new Date(`${normalized}${DEFAULT_TIMEZONE_OFFSET}`)
  return isNaN(d.valueOf()) ? undefined : d
}

const toDate = z
  .union([z.date(), z.string()])
  .optional()
  .transform((val) => {
    if (!val) return undefined
    if (val instanceof Date) return val
    return parseFrontmatterDate(val as string)
  })

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z
    .object({
      title: z.string(),
      date: toDate,
      updated: toDate,
      summary: z.string().optional(),
      cover: z.string().nullable().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).default([]),
      comments: z.boolean().default(true),
      draft: z.boolean().default(false),
      pinned: z.boolean().default(false),
      index: z
        .union([z.string(), z.number()])
        .optional()
        .transform((v) => {
          if (v === undefined || v === null) return undefined
          return String(v)
        }),
      unlisted: z.boolean().optional(),
      aiSummary: z.boolean().optional(),
      outdate: z.boolean().optional(),
      slug: z.union([z.string(), z.number()]).optional(),
    })
    .transform((data) => ({
      ...data,
      sticky: data.pinned ? 1 : 0,
      lastMod: data.updated,
      date: (data.date ?? data.updated) as Date | undefined,
    }))
    .refine((v) => v.date instanceof Date, {
      message: 'posts: invalid or missing "date"',
      path: ['date'],
    }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml,toml}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    link: z.string().url(),
  }),
})

const services = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml,toml}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    link: z.string().url(),
    repository: z.string().url().optional(),
  }),
})

const spec = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/spec' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    comments: z.boolean().default(true),
  }),
})

export const collections = {
  posts,
  projects,
  services,
  spec,
}
