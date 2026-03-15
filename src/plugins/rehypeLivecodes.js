import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

function normalizeClassName(className) {
  if (!className) return []
  if (Array.isArray(className)) return className.map(String)
  return String(className).split(/\s+/).filter(Boolean)
}

function getNodeText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  if (Array.isArray(node.children)) return node.children.map(getNodeText).join('')
  return ''
}

function findFirstElement(node, predicate) {
  if (!node) return null
  if (node.type === 'element' && predicate(node)) return node
  if (!Array.isArray(node.children)) return null
  for (const child of node.children) {
    const found = findFirstElement(child, predicate)
    if (found) return found
  }
  return null
}

function getCodeLang(container, pre) {
  const preProps = pre.properties || {}
  if (typeof preProps['data-language'] === 'string') return preProps['data-language']
  if (typeof preProps['data-lang'] === 'string') return preProps['data-lang']

  const langTag = findFirstElement(container, (n) => {
    const cls = normalizeClassName(n.properties?.className)
    return n.tagName === 'span' && cls.includes('lang-tag')
  })
  const langTagText = langTag ? getNodeText(langTag).trim() : ''
  if (langTagText) return langTagText

  const code = findFirstElement(pre, (n) => n.tagName === 'code')
  const codeClass = normalizeClassName(code?.properties?.className)
  const m = codeClass.find((c) => c.startsWith('language-'))
  if (m) return m.slice('language-'.length)

  return 'text'
}

function mapTemplate(lang) {
  const l = String(lang || '').toLowerCase()
  if (l === 'jsx' || l === 'react') return 'react'
  if (l === 'tsx') return 'react-ts'
  if (l === 'ts' || l === 'typescript') return 'vanilla-ts'
  if (l === 'js' || l === 'javascript') return 'vanilla'
  if (l === 'html') return 'static'
  if (l === 'css') return 'static'
  return 'vanilla'
}

function escapeJsonString(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function buildFiles({ template, lang, code }) {
  const t = String(template)
  const l = String(lang || '').toLowerCase()

  if (t === 'static') {
    if (l === 'css') {
      return {
        'sandbox.config.json': { content: '{"template":"static"}' },
        'index.html': {
          content:
            '<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="./styles.css"/></head><body><div id="app"></div></body></html>',
        },
        'styles.css': { content: code },
      }
    }
    return {
      'sandbox.config.json': { content: '{"template":"static"}' },
      'index.html': { content: code },
    }
  }

  if (t === 'vanilla') {
    return {
      'sandbox.config.json': { content: '{"template":"vanilla"}' },
      'package.json': {
        content:
          '{"name":"demo","version":"0.0.0","private":true,"description":"","main":"index.html"}',
      },
      'index.html': {
        content:
          '<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><script type="module" src="./index.js"></script></body></html>',
      },
      'index.js': { content: code },
    }
  }

  if (t === 'vanilla-ts') {
    return {
      'sandbox.config.json': { content: '{"template":"vanilla-ts"}' },
      'package.json': {
        content:
          '{"name":"demo","version":"0.0.0","private":true,"description":"","main":"index.html"}',
      },
      'tsconfig.json': {
        content:
          '{"compilerOptions":{"target":"ES2020","module":"ESNext","moduleResolution":"Bundler","strict":true,"jsx":"react-jsx"}}',
      },
      'index.html': {
        content:
          '<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><script type="module" src="./index.ts"></script></body></html>',
      },
      'index.ts': { content: code },
    }
  }

  if (t === 'react' || t === 'react-ts') {
    const isTs = t === 'react-ts'
    const appExt = isTs ? 'tsx' : 'js'
    const indexExt = isTs ? 'tsx' : 'js'

    const usesOwnRender = /(createRoot|ReactDOM\.)/.test(code)

    const appFile = usesOwnRender
      ? {
          [`src/index.${indexExt}`]: { content: code },
        }
      : {
          [`src/App.${appExt}`]: {
            content: code.trim().length
              ? code
              : isTs
                ? 'export default function App() {\n  return <div>Hello CodeSandbox</div>\n}\n'
                : 'export default function App() {\n  return <div>Hello CodeSandbox</div>\n}\n',
          },
          [`src/index.${indexExt}`]: {
            content: isTs
              ? [
                  "import { createRoot } from 'react-dom/client'",
                  "import App from './App'",
                  '',
                  "createRoot(document.getElementById('root')!).render(<App />)",
                  '',
                ].join('\n')
              : [
                  "import { createRoot } from 'react-dom/client'",
                  "import App from './App'",
                  '',
                  "createRoot(document.getElementById('root')).render(<App />)",
                  '',
                ].join('\n'),
          },
        }

    return {
      'sandbox.config.json': { content: `{"template":"${t}"}` },
      'package.json': {
        content: escapeJsonString({
          name: 'demo',
          private: true,
          version: '0.0.0',
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        }),
      },
      'public/index.html': {
        content:
          '<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div></body></html>',
      },
      ...appFile,
    }
  }

  return null
}

export function rehypeLivecodes() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (node.tagName !== 'div') return

      const classes = normalizeClassName(node.properties?.className)
      if (!classes.includes('livecodes')) return

      const pre = findFirstElement(node, (n) => n.tagName === 'pre')
      if (!pre) return

      const lang = getCodeLang(node, pre)
      const template = node.properties?.['data-lc-template'] || mapTemplate(lang)
      const heightRaw = node.properties?.['data-lc-height']
      const height = Number.isFinite(Number(heightRaw)) ? Number(heightRaw) : 520
      const title = node.properties?.['data-lc-title']

      const code = getNodeText(pre)

      const payload = { template: String(template), code, lang }

      const data = h(
        'script',
        {
          type: 'application/json',
          class: 'livecodes-runner__data',
          ...(title ? { 'data-title': String(title) } : {}),
        },
        escapeJsonString(payload),
      )

      const mount = h('div', { class: 'livecodes-runner__mount' })

      const codeWrapper = h('div', { class: 'livecodes-runner__code' }, node.children || [])

      parent.children[index] = h(
        'div',
        { class: 'livecodes-runner', 'data-lc-height': String(height) },
        [mount, data, codeWrapper],
      )
    })
  }
}
