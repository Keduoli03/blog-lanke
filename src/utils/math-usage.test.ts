import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'src/content/posts')

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
  })
}

function containsMath(markdown: string) {
  let fence: '`' | '~' | undefined
  const prose = markdown
    .split(/\r?\n/)
    .filter((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]?.[0] as '`' | '~' | undefined
      if (marker && (!fence || marker === fence)) {
        fence = fence ? undefined : marker
        return false
      }
      return !fence
    })
    .join('\n')
    .replace(/`[^`\n]*`/g, '')
  return /^\s*\$\$\s*$/m.test(prose) || /\$[^$\r\n]+\$/m.test(prose)
}

describe('math syntax usage', () => {
  it('ignores math-like text inside backtick and tilde fences', () => {
    expect(containsMath('```md\n$hidden$\n```')).toBe(false)
    expect(containsMath('~~~md\n$hidden$\n~~~')).toBe(false)
    expect(containsMath('$visible$')).toBe(true)
  })

  it('keeps KaTeX enabled while published Markdown uses math syntax', () => {
    const usage = markdownFiles(root)
      .filter((path) => containsMath(readFileSync(path, 'utf8')))
      .map((path) => relative(root, path).replace(/\\/g, '/'))

    console.info(`Math syntax files: ${usage.join(', ') || '(none)'}`)
    expect(usage.length).toBeGreaterThan(0)

    const config = readFileSync(join(process.cwd(), 'astro.config.js'), 'utf8')
    const layout = readFileSync(join(process.cwd(), 'src/layouts/MarkdownLayout.astro'), 'utf8')
    expect(config).toContain('math: true')
    expect(config).toContain('satteriMdastPlugins')
    expect(config).toContain('satteriHastPlugins')
    expect(layout).toContain("import 'katex/dist/katex.min.css'")
  })
})
