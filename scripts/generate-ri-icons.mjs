import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import prettier from 'prettier'

const require = createRequire(import.meta.url)
const collection = JSON.parse(readFileSync(require.resolve('@iconify-json/ri/icons.json'), 'utf8'))
const sourceDirectory = fileURLToPath(new URL('../src/', import.meta.url))
const outputPath = fileURLToPath(new URL('../src/icons/ri.ts', import.meta.url))
const icons = {
  riArchiveLine: 'archive-line',
  riAtLine: 'at-line',
  riBallPenLine: 'ball-pen-line',
  riCalendar2Line: 'calendar-2-line',
  riChat1Line: 'chat-1-line',
  riCloseLine: 'close-line',
  riComputerLine: 'computer-line',
  riFilmLine: 'film-line',
  riFlaskLine: 'flask-line',
  riFolder2Line: 'folder-2-line',
  riGhostLine: 'ghost-line',
  riGithubLine: 'github-line',
  riHeart2Line: 'heart-2-line',
  riLinkM: 'link-m',
  riLinksLine: 'links-line',
  riMailLine: 'mail-line',
  riMenuLine: 'menu-line',
  riMoonLine: 'moon-line',
  riPantoneLine: 'pantone-line',
  riPriceTag3Line: 'price-tag-3-line',
  riRestartLine: 'restart-line',
  riRocket2Line: 'rocket-2-line',
  riSearchLine: 'search-line',
  riSunLine: 'sun-line',
  riTrainLine: 'train-line',
  riTwitterXLine: 'twitter-x-line',
}

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx|astro)$/.test(name) ? [path] : []
  })
}

function collectUsedIcons() {
  const used = new Set()
  const importPattern = /import\s*\{([^}]*)\}\s*from\s*['"]@\/icons\/ri['"]/g

  for (const path of sourceFiles(sourceDirectory)) {
    const source = readFileSync(path, 'utf8')
    for (const match of source.matchAll(importPattern)) {
      for (const imported of match[1].split(',')) {
        const name = imported.trim().split(/\s+as\s+/)[0]
        if (name) used.add(name)
      }
    }
  }

  return used
}

const usedIcons = collectUsedIcons()
const missingIcons = [...usedIcons].filter((name) => !(name in icons))
const unusedIcons = Object.keys(icons).filter((name) => !usedIcons.has(name))
if (missingIcons.length || unusedIcons.length) {
  throw new Error(
    [
      missingIcons.length ? `Missing generated icons: ${missingIcons.join(', ')}` : '',
      unusedIcons.length ? `Unused generated icons: ${unusedIcons.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )
}

const output = await prettier.format(
  [
    "import type { IconifyIcon } from '@iconify/types'",
    '',
    '// Generated from @iconify-json/ri by scripts/generate-ri-icons.mjs.',
    ...Object.entries(icons).map(([exportName, iconName]) => {
      const icon = collection.icons[iconName]
      if (!icon) throw new Error(`Missing Remix Icon: ${iconName}`)
      return `export const ${exportName}: IconifyIcon = ${JSON.stringify({
        ...icon,
        width: collection.width,
        height: collection.height,
      })}`
    }),
    '',
  ].join('\n'),
  { parser: 'typescript', singleQuote: true, semi: false, printWidth: 100 },
)

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8')
  if (current !== output) {
    throw new Error('Generated icon data is stale. Run `pnpm generate:icons`.')
  }
} else {
  writeFileSync(outputPath, output)
}
