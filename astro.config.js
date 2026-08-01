import { defineConfig } from 'astro/config'
import { satteri } from '@astrojs/markdown-satteri'
import { satteriMdastPlugins, satteriHastPlugins } from './src/plugins/satteri'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { site } from './src/config.json'
import swup from '@swup/astro'
import icon from 'astro-icon'
import expressiveCode from 'astro-expressive-code'

// https://astro.build/config
export default defineConfig({
  site: site.url,
  compressHTML: true,
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      emitExternalStylesheet: false,
      styleOverrides: {
        borderRadius: '0.5rem',
        borderWidth: '0px',
        codeBackground: 'rgb(var(--color-bg-secondary))',
        codeForeground: 'rgb(var(--color-text-primary))',
        codeFontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
        codeFontSize: '0.875rem',
        codeLineHeight: '1.625',
        codePaddingBlock: '1rem',
        codePaddingInline: '1.5rem',
        frames: {
          shadowColor: 'transparent',
          editorBackground: 'rgb(var(--color-bg-secondary))',
        },
      },
    }),
    react(),
    sitemap(),
    swup({
      theme: false,
      animationClass: 'swup-transition-',
      containers: ['main'],
    }),
    icon(),
  ],
  markdown: {
    processor: satteri({
      features: {
        gfm: {
          footnotes: {
            label: '\u53c2\u8003',
            backLabel: '\u8fd4\u56de\u6b63\u6587 {reference}',
            backContent: '\u21a9',
          },
        },
        // Astro extracts document frontmatter before invoking the processor.
        // Disable Satteri frontmatter parsing so body thematic breaks stay content.
        frontmatter: false,
        math: true,
        directive: true,
        smartPunctuation: false,
      },
      mdastPlugins: satteriMdastPlugins(),
      hastPlugins: satteriHastPlugins(),
    }),
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['math'],
    },
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },
})
