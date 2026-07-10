import fs from 'fs'
import path from 'path'

const postsDir = path.resolve('src/content/posts')

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...listMarkdownFiles(fullPath))
    else if (entry.name.endsWith('.md')) files.push(fullPath)
  }

  return files
}

function splitFrontmatter(content) {
  if (!content.startsWith('---')) return null
  const end = content.indexOf('\n---', 3)
  if (end === -1) return null

  return {
    frontmatter: content.slice(4, end).replace(/^\n/, ''),
    body: content.slice(end + 4).replace(/^\n/, ''),
  }
}

function parseFrontmatter(text) {
  const data = {}
  let currentKey = null

  for (const line of text.split('\n')) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/)
    if (arrayItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(arrayItem[1].trim().replace(/^['"]|['"]$/g, ''))
      continue
    }

    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!match) continue

    currentKey = match[1]
    const raw = match[2].trim()

    if (!raw) {
      data[currentKey] = []
      continue
    }

    if (raw === 'true') data[currentKey] = true
    else if (raw === 'false') data[currentKey] = false
    else if (/^['"].*['"]$/.test(raw)) data[currentKey] = raw.slice(1, -1)
    else data[currentKey] = raw
  }

  return data
}

function serializeValue(value) {
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (typeof value === 'number') return String(value)
  if (/[:#{}[\],&*?|>!%@`]|^\s|\s$/.test(value)) return `'${value.replace(/'/g, "''")}'`
  return value
}

function serializeFrontmatter(data) {
  const order = [
    'title',
    'summary',
    'category',
    'tags',
    'date',
    'updated',
    'slug',
    'cover',
    'pinned',
    'draft',
    'unlisted',
    'comments',
    'aiSummary',
    'outdate',
    'index',
  ]

  const lines = []
  const used = new Set()

  for (const key of order) {
    if (!(key in data)) continue
    used.add(key)
    const value = data[key]

    if (Array.isArray(value)) {
      if (!value.length) continue
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${serializeValue(item)}`)
      continue
    }

    if (value === '' || value === null || value === undefined) continue
    lines.push(`${key}: ${serializeValue(String(value))}`)
  }

  for (const [key, value] of Object.entries(data)) {
    if (used.has(key)) continue
    if (Array.isArray(value)) {
      if (!value.length) continue
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${serializeValue(item)}`)
      continue
    }
    lines.push(`${key}: ${serializeValue(String(value))}`)
  }

  return lines.join('\n')
}

function normalizeData(data, filePath) {
  const normalized = { ...data }

  if (!normalized.summary && normalized.description) {
    normalized.summary = normalized.description
  }

  if (!normalized.category && Array.isArray(normalized.categories) && normalized.categories[0]) {
    normalized.category = normalized.categories[0]
  }

  if (typeof normalized.status === 'boolean') {
    normalized.draft = !normalized.status
  }

  if (normalized.pinned === true) {
    normalized.pinned = true
  } else {
    delete normalized.pinned
  }

  if (normalized.draft !== true) delete normalized.draft
  if (normalized.unlisted !== true) delete normalized.unlisted
  if (normalized.comments === true) delete normalized.comments
  if (normalized.aiSummary !== true) delete normalized.aiSummary
  if (normalized.outdate !== true) delete normalized.outdate
  if (!normalized.cover) delete normalized.cover

  const rel = filePath.replace(/\\/g, '/')
  if (rel.includes('/专栏/') || rel.includes('/column/')) {
    delete normalized.column
  } else {
    delete normalized.column
  }

  delete normalized.description
  delete normalized.categories
  delete normalized.status
  delete normalized.sticky
  delete normalized.lastMod
  delete normalized.column

  return normalized
}

const files = listMarkdownFiles(postsDir)
let changed = 0

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parts = splitFrontmatter(raw)
  if (!parts) continue

  const data = parseFrontmatter(parts.frontmatter)
  const normalized = normalizeData(data, filePath)
  const nextFrontmatter = serializeFrontmatter(normalized)
  const next = `---\n${nextFrontmatter}\n---\n\n${parts.body.replace(/^\n+/, '')}`

  if (next !== raw) {
    fs.writeFileSync(filePath, next.endsWith('\n') ? next : `${next}\n`)
    changed += 1
  }
}

console.log(`Normalized ${changed} of ${files.length} posts.`)
