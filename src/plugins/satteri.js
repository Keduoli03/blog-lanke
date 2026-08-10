import { h } from 'hastscript'
import getReadingTime from 'reading-time'
import katex from 'katex'
import { fromHtml } from 'hast-util-from-html'
import fs from 'node:fs'
import path from 'node:path'

// 构建 posts 文件名/slug -> 文章 URL 的映射（本地 .md 相对链接自动转绝对路径用）
let postUrlMap = null
function getPostUrlMap() {
  if (postUrlMap) return postUrlMap
  postUrlMap = new Map()
  const dir = path.join(process.cwd(), 'src/content/posts')
  if (!fs.existsSync(dir)) return postUrlMap
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
    const fm = /^---\n([\s\S]*?)\n---/.exec(raw)
    if (!fm) continue
    const body = fm[1]
    const slug = /^slug:\s*(.+)$/m.exec(body)?.[1]?.trim()
    const title = /^title:\s*(.+)$/m.exec(body)?.[1]?.trim()
    const base = file.replace(/\.md$/, '')
    const url = `/posts/${slug || base}/`
    postUrlMap.set(base, url)
    if (slug) postUrlMap.set(slug, url)
    if (title) postUrlMap.set(title, url)
  }
  return postUrlMap
}

function setData(node, ctx, patch) {
  ctx.setProperty(node, 'data', { ...(node.data || {}), ...patch })
}

function setHProperties(node, ctx, patch) {
  setData(node, ctx, { hProperties: { ...(node.data?.hProperties || {}), ...patch } })
}
function imageSize(alt = '', title = '') {
  const altMatch = /^(.*?)\s*[|]\s*(\d+)(?:\s*[xX]\s*(\d+))?\s*$/.exec(alt)
  const titleMatch = /^\s*(\d+)(?:\s*[xX]\s*(\d+))?\s*$/.exec(title)
  if (altMatch) return { alt: altMatch[1].trim(), width: altMatch[2], height: altMatch[3] }
  if (titleMatch) return { alt, width: titleMatch[1], height: titleMatch[2], clearTitle: true }
  return null
}

function imageSizePlugin() {
  return {
    name: 'image-size',
    image(node, ctx) {
      const parsed = imageSize(node.alt || '', node.title || '')
      if (!parsed) return
      const styles = []
      if (parsed.width)
        styles.push(`width:${parsed.width}px !important`, 'max-width:100% !important')
      if (parsed.height) styles.push(`height:${parsed.height}px !important`)
      if (parsed.width && !parsed.height) styles.push('height:auto !important')
      styles.push('display:block', 'margin:0 auto')
      ctx.setProperty(node, 'alt', parsed.alt)
      if (parsed.clearTitle) ctx.setProperty(node, 'title', '')
      setHProperties(node, ctx, {
        'data-md-width': parsed.width,
        ...(parsed.height ? { 'data-md-height': parsed.height } : {}),
        style: styles.join(';'),
      })
    },
  }
}

function readingTimePlugin() {
  // 工厂模式：satteri 每个文档编译时调用一次，闭包在文档间自动重置
  return () => {
    let text = ''
    return {
      name: 'reading-time',
      text(node, ctx) {
        text += node.value
        const result = getReadingTime(text)
        const astro = ctx.data.astro || (ctx.data.astro = {})
        astro.frontmatter = {
          ...(astro.frontmatter || {}),
          readingMinutes: result.minutes,
          words: result.words,
        }
      },
    }
  }
}

function embedPlugin() {
  return {
    name: 'embed-directives',
    leafDirective(node, ctx) {
      const id = node.attributes?.id
      if (!id || !['youtube', 'bilibili', 'codepen'].includes(node.name)) return
      const props = {
        class: node.name === 'codepen' ? 'codepen' : 'video',
        title:
          node.name === 'youtube'
            ? 'YouTube Video Player'
            : node.name === 'bilibili'
              ? 'Bilibili Video Player'
              : 'CodePen Embed',
        src:
          node.name === 'youtube'
            ? `https://www.youtube.com/embed/${id}`
            : node.name === 'bilibili'
              ? `//player.bilibili.com/player.html?isOutside=true&bvid=${id}`
              : `https://codepen.io/${node.attributes.author || ''}/embed/${id}`,
        frameBorder: 0,
        allowFullScreen: true,
        loading: 'lazy',
      }
      if (node.name === 'youtube')
        props.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      setData(node, ctx, { hName: 'iframe', hProperties: props })
    },
  }
}

function legacyLivecodesFallbackPlugin() {
  return {
    name: 'legacy-livecodes-fallback',
    containerDirective(node, ctx) {
      if (node.name !== 'livecodes') return

      // LiveCodes has been retired, but older posts may still wrap a fenced
      // code block in :::livecodes. Remove only the obsolete wrapper so the
      // nested Markdown continues through the normal rendering pipeline.
      ctx.insertBefore(node, node.children)
      ctx.removeNode(node)
    },
  }
}

function spoilerPlugin() {
  function escape(value) {
    return value.replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    )
  }
  return {
    name: 'spoiler',
    text(node, ctx) {
      if (!node.value.includes('||')) return
      const source = escape(node.value)
      const html = source.replace(
        /\|\|(.+?)\|\|/g,
        '<span class="spoiler" title="Click to reveal">$1</span>',
      )
      if (html !== source) ctx.replaceNode(node, { rawHtml: html })
    },
  }
}

function headingPlugin() {
  return {
    name: 'headings',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        const title = ctx.textContent(node).trim()
        ctx.appendChild(
          node,
          h(
            'a',
            {
              href: `#${node.properties?.id || ''}`,
              class: 'heading-anchor',
              ariaLabel: 'Heading Anchor',
            },
            h('iconify-icon', { icon: 'ri:links-line' }),
          ),
        )
        const classes = Array.isArray(node.properties?.className) ? node.properties.className : []
        ctx.setProperty(node, 'className', [...classes, 'heading'])
        ctx.setProperty(node, 'data-title', title)
      },
    },
  }
}

function codeLanguageTitlePlugin() {
  return {
    name: 'code-language-title',
    code(node, ctx) {
      if (!node.lang || node.meta) return
      ctx.setProperty(node, 'meta', `title="${node.lang}"`)
    },
  }
}
function linkPlugin() {
  return {
    name: 'external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href
        if (typeof href !== 'string') return
        // 本地 .md 相对链接 → 自动解析为目标文章绝对路径
        // （源文件在本地写作时用相对路径，如 [标题](另一篇文章.md)，构建时自动转换）
        // 注意：satteri 处理时中文已被 percent-encode，需先解码
        const rawHref = decodeURIComponent(href)
        const mdMatch = /^(?!https?:\/\/)(?!\/)(?!mailto:)([^#]+?)\.md(?:#(.+))?$/.exec(rawHref)
        if (mdMatch) {
          const targetName = mdMatch[1].split('/').pop() // 兼容 子目录/文章.md
          const anchor = mdMatch[2] ? `#${mdMatch[2]}` : ''
          const url = getPostUrlMap().get(targetName)
          if (url) {
            ctx.setProperty(node, 'href', `${url}${anchor}`)
            return
          }
        }
        if (/\.md(?:#.*)?$/.test(rawHref)) {
          ctx.setProperty(node, 'href', href.replace(/\.md(?=#|$)/, ''))
        }
        if (!rawHref.startsWith('http')) return
        ctx.setProperty(node, 'rel', 'noopener noreferrer')
        ctx.setProperty(node, 'target', '_blank')
        ctx.insertAfter(node, h('iconify-icon', { icon: 'ri:external-link-line' }))
      },
    },
  }
}

function imagePlugin() {
  function buildImage(node) {
    const props = { ...(node.properties || {}) }
    if (props.src) props['data-original-src'] = props.src
    const width = props['data-md-width']
    const height = props['data-md-height']
    const rules = []
    if (width) rules.push(`width:${width}px`, 'max-width:100%')
    if (height) rules.push(`height:${height}px`)
    if (width && !height) rules.push('height:auto')
    if (rules.length)
      props.style = props.style ? `${props.style};${rules.join(';')}` : rules.join(';')
    return h('img', { ...props, loading: 'lazy' })
  }
  return {
    name: 'images',
    element: {
      filter: ['p'],
      visit(node) {
        if (
          node.tagName === 'p' &&
          node.children?.length === 1 &&
          node.children[0]?.tagName === 'img'
        ) {
          const image = buildImage(node.children[0])
          const width = image.properties?.['data-md-width']
          const title =
            typeof image.properties?.title === 'string' ? image.properties.title.trim() : ''
          return h(
            'figure',
            {
              ...(width
                ? { style: `width:${width}px;max-width:100%;margin-left:auto;margin-right:auto` }
                : {}),
            },
            [image, ...(title ? [h('figcaption', title)] : [])],
          )
        }
        if (node.tagName === 'img') return buildImage(node)
      },
    },
  }
}

function tablePlugin() {
  return {
    name: 'tables',
    element: {
      filter: ['table', 'th', 'td'],
      visit(node, ctx) {
        if (node.tagName === 'table') return h('div', { class: 'table-wrapper' }, [node])
        const align = node.properties?.align
        if (align) {
          ctx.setProperty(node, 'style', `text-align: ${align};`)
          ctx.setProperty(node, 'align', null)
        }
      },
    },
  }
}

function renderMathNode(node, ctx, source, displayMode) {
  const html = katex.renderToString(source.replace(/\n$/, ''), {
    displayMode,
    throwOnError: false,
    output: 'htmlAndMathml',
  })
  const rendered = fromHtml(html, { fragment: true }).children[0]
  if (rendered) ctx.replaceNode(node, rendered)
}

function mathBlockPlugin() {
  return {
    name: 'math-block',
    element: {
      filter: ['pre'],
      visit(node, ctx) {
        const code = node.children?.find((child) => child.tagName === 'code')
        if (!code) return
        const classes = Array.isArray(code.properties?.className) ? code.properties.className : []
        const language =
          code.data?.lang ??
          node.properties?.dataLanguage ??
          node.properties?.dataLang ??
          node.properties?.['data-language']
        if (language !== 'math' && !classes.includes('language-math')) return
        renderMathNode(node, ctx, ctx.textContent(code), true)
      },
    },
  }
}

function mathInlinePlugin() {
  return {
    name: 'math-inline',
    element: {
      filter: ['code'],
      visit(node, ctx) {
        const classes = Array.isArray(node.properties?.className) ? node.properties.className : []
        if (!classes.includes('math-inline')) return
        renderMathNode(node, ctx, ctx.textContent(node), false)
      },
    },
  }
}
function codeBlockPlugin() {
  return {
    name: 'code-blocks',
    element: {
      filter: ['pre'],
      visit(node) {
        const code = node.children?.find((child) => child.tagName === 'code')
        const classes = code?.properties?.className
        const langClass = Array.isArray(classes)
          ? classes.find((item) => String(item).startsWith('language-'))
          : null
        const dataLanguage = node.properties?.dataLanguage
        const lang = dataLanguage || (langClass ? String(langClass).slice(9) : 'text')
        return h('div', { class: 'code-block' }, [h('span', { class: 'lang-tag' }, lang), node])
      },
    },
  }
}

function calloutPlugin() {
  return {
    name: 'callouts',
    element: {
      filter: ['blockquote'],
      visit(node, ctx) {
        const first = node.children?.find((child) => child.tagName === 'p')
        const firstText =
          first?.tagName === 'p' ? first.children?.find((child) => child.type === 'text') : null
        const sourceText = ctx.textContent(node)
        const match = /\[!([A-Za-z]+)\](?:[ \t]+([^\n]*))?/.exec(sourceText)
        if (!match) return
        const type = match[1].toLowerCase()
        const title = match[2]?.trim() || type[0].toUpperCase() + type.slice(1)
        const remainder = sourceText.replace(match[0], '').trim()
        const content = []
        if (remainder)
          content.push(
            h('p', remainder, first.children.slice(first.children.indexOf(firstText) + 1)),
          )
        content.push(...node.children.slice(node.children.indexOf(first) + 1))
        const titleNode = h('div', { class: 'callout-title' }, [
          h('span', { class: 'callout-title-icon' }, [
            h('iconify-icon', { icon: 'ri:information-line' }),
          ]),
          h('span', { class: 'callout-title-text' }, title),
        ])
        return h('div', { class: 'callout', 'data-callout': type, 'data-collapsible': 'false' }, [
          titleNode,
          h('div', { class: 'callout-content' }, content),
        ])
      },
    },
  }
}

export function satteriMdastPlugins() {
  return [
    legacyLivecodesFallbackPlugin(),
    codeLanguageTitlePlugin(),
    imageSizePlugin(),
    readingTimePlugin,
    embedPlugin(),
    spoilerPlugin(),
  ]
}
export function satteriHastPlugins() {
  return [
    headingPlugin(),
    linkPlugin(),
    imagePlugin(),
    mathBlockPlugin(),
    mathInlinePlugin(),
    tablePlugin(),
    calloutPlugin(),
  ]
}
