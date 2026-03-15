import { createPlayground, type EmbedOptions } from 'livecodes'

type RunnerPayload = {
  template?: string
  code?: string
  lang?: string
}

function getHeight(el: HTMLElement) {
  const raw = el.getAttribute('data-lc-height')
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? n : 520
}

function getTheme(): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    const dataTheme = document.documentElement.getAttribute('data-theme')
    if (dataTheme === 'dark' || dataTheme === 'light') {
      return dataTheme
    }
  }
  return 'light'
}

let instances: any[] = []

export function initLivecodes() {
  // 销毁旧实例
  instances.forEach((instance) => {
    try {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy()
      }
    } catch (e) {
      console.error(e)
    }
  })
  instances = []

  const theme = getTheme()
  const runners = document.querySelectorAll<HTMLElement>('.livecodes-runner:not([data-lc-init])')
  runners.forEach((runner) => {
    runner.setAttribute('data-lc-init', '1')
    const mount = runner.querySelector<HTMLElement>('.livecodes-runner__mount')
    const dataEl = runner.querySelector<HTMLScriptElement>('.livecodes-runner__data')
    if (!mount || !dataEl) return

    let payload: RunnerPayload | null = null
    try {
      payload = JSON.parse((dataEl.textContent || '').trim())
    } catch {
      mount.textContent = 'Livecodes 数据解析失败'
      return
    }

    const template = String(payload?.template || 'vanilla')
    const height = getHeight(runner)

    // Convert to config format expected by LiveCodes
    let config: EmbedOptions['config'] = {
      theme: theme,
      mode: 'simple',
      layout: 'responsive',
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      fontSize: 14,
    }

    // LiveCodes template name conversion
    let lcTemplate = template
    if (template === 'vanilla' || template === 'vanilla-ts') {
      lcTemplate = 'blank' // 'blank' is the correct template for plain JS/TS
    }

    if (template === 'react' || template === 'react-ts') {
      config = {
        ...config,
        activeEditor: 'script',
        script: {
          language: template === 'react-ts' ? 'tsx' : 'jsx',
          content: payload?.code || '',
        },
      }
    } else {
      // Default to standard script/markup configuration
      let lang = payload?.lang || 'javascript'

      // Normalize language name
      if (lang === 'js' || lang === 'javascript') {
        lang = 'javascript'
      } else if (lang === 'ts' || lang === 'typescript') {
        lang = 'typescript'
      } else if (lang === 'html') {
        lang = 'html'
      } else if (lang === 'css') {
        lang = 'css'
      }

      if (lang === 'html') {
        config = {
          ...config,
          activeEditor: 'markup',
          markup: {
            language: 'html',
            content: payload?.code || '',
          },
        }
      } else if (lang === 'css') {
        config = {
          ...config,
          activeEditor: 'style',
          style: {
            language: 'css',
            content: payload?.code || '',
          },
        }
      } else {
        config = {
          ...config,
          activeEditor: 'script',
          script: {
            language: lang as any,
            content: payload?.code || '',
          },
        }
      }
    }

    // Set height inline to make sure it's sized properly
    mount.style.height = `${height}px`
    mount.style.width = '100%'

    createPlayground(mount, {
      template: lcTemplate as any,
      config: config,
    }).then((playground) => {
      instances.push(playground)
    })
  })
}

// 监听主题变化，动态更新已存在的 LiveCodes 实例
if (typeof document !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        const newTheme = getTheme()
        instances.forEach((instance) => {
          try {
            if (instance && typeof instance.setConfig === 'function') {
              instance.setConfig({ theme: newTheme })
            }
          } catch (e) {
            console.error(e)
          }
        })
      }
    })
  })
  observer.observe(document.documentElement, { attributes: true })
}
