import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd(), 'src')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(?:ts|tsx|astro)$/.test(name)
        ? [path]
        : []
  })
}

describe('phase 3 runtime boundaries', () => {
  it('server renders one Header shell before hydrating it', () => {
    for (const layout of ['layouts/PageLayout.astro', 'layouts/MarkdownLayout.astro']) {
      const source = read(layout)
      expect(source).toContain('HeaderShell')
      expect(source).toContain('client:load')
      expect(source).not.toContain('<Provider')
      expect(source).not.toContain('<Header ')
    }
  })

  it('keeps the hydrated Header shell stable while Swup replaces route metadata', () => {
    const config = readFileSync(resolve(process.cwd(), 'astro.config.js'), 'utf8')

    expect(config).not.toContain('morph:')
    for (const layout of ['layouts/PageLayout.astro', 'layouts/MarkdownLayout.astro']) {
      expect(read(layout)).toContain('data-header-title=')
    }
  })

  it('uses server-rendered header metadata before the article main element is parsed', () => {
    const header = read('components/header/Header.tsx')
    const layout = read('layouts/Layout.astro')

    expect(header).toContain("data-header-has-meta={hasInitialMeta ? 'true' : 'false'}")
    expect(layout).toContain("[data-site-header][data-header-has-meta='false']")
    expect(layout).toContain('html[data-header-ready]')
  })

  it('does not register the complete Remix Icon collection at runtime', () => {
    const componentSources = sourceFiles(resolve(root, 'components')).map((path) =>
      readFileSync(path, 'utf8'),
    )
    expect(componentSources.some((source) => source.includes('registerRi'))).toBe(false)

    const iconSource = read('icons/ri.ts')
    expect(iconSource).not.toContain('addCollection')
    expect(iconSource).not.toContain("from '@iconify-json/ri'")
  })

  it('renders simple date displays without React islands', () => {
    expect(read('components/footer/Footer.astro')).not.toContain('RunningDays client:')
    expect(read('components/post/PostMetaInfo.astro')).not.toContain('RelativeDate')
  })

  it('loads toast feedback only on article layouts and safely delays the global modal host', () => {
    expect(read('layouts/Layout.astro')).not.toContain('<ToastContainer')
    const markdownLayout = read('layouts/MarkdownLayout.astro')
    expect(markdownLayout).toContain('<ToastContainer client:idle />')
    expect(markdownLayout.indexOf('<ToastContainer client:idle />')).toBeLessThan(
      markdownLayout.indexOf('</main>'),
    )
    expect(read('layouts/Layout.astro')).toContain('<ModalStack client:idle />')
  })

  it('keeps persistent simple Header transitions out of Framer Motion', () => {
    expect(read('components/header/AnimatedLogo.tsx')).not.toContain("from 'framer-motion'")
    expect(read('components/header/HeaderMeta.tsx')).not.toContain("from 'framer-motion'")
    expect(read('components/header/AnimatedLogo.tsx')).toContain('aria-hidden={hidden}')
    expect(read('components/header/HeaderMeta.tsx')).toContain('aria-hidden={!shouldShow}')
    expect(read('components/header/HeaderContent.tsx')).toContain(
      'aria-hidden={shouldHeaderMetaShow}',
    )
  })
})
