import { defineConfig } from 'astro/config'
import { remarkReadingTime } from './src/plugins/remarkReadingTime'
import { rehypeCodeBlock } from './src/plugins/rehypeCodeBlock'
import { rehypeTableBlock } from './src/plugins/rehypeTableBlock'
import { rehypeCodeHighlight } from './src/plugins/rehypeCodeHighlight'
import { rehypeImage } from './src/plugins/rehypeImage'
import { rehypeLink } from './src/plugins/rehypeLink'
import { rehypeHeading } from './src/plugins/rehypeHeading'
import remarkDirective from 'remark-directive'
import { remarkSpoiler } from './src/plugins/remarkSpoiler'
import { remarkEmbed } from './src/plugins/remarkEmbed'
import { remarkImageSize } from './src/plugins/remarkImageSize'
import { remarkLivecodes } from './src/plugins/remarkLivecodes'
import { rehypeLivecodes } from './src/plugins/rehypeLivecodes'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark'
import { site } from './src/config.json'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import swup from '@swup/astro'
import rehypeCallouts from 'rehype-callouts'

import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
  site: site.url,
  compressHTML: true,
  integrations: [
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
    processor: unified({
      smartypants: false,
      remarkPlugins: [
        remarkMath,
        remarkDirective,
        remarkImageSize,
        remarkEmbed,
        remarkLivecodes,
        remarkSpoiler,
        remarkReadingTime,
      ],
      rehypePlugins: [
        rehypeHeadingIds,
        rehypeKatex,
        // Use GitHub-like palette so Important 为紫色、Warning 为橙黄等
        [rehypeCallouts, { theme: 'github', showIndicator: true }],
        rehypeLink,
        rehypeImage,
        rehypeHeading,
        rehypeCodeBlock,
        rehypeCodeHighlight,
        rehypeLivecodes,
        rehypeTableBlock,
      ],
      remarkRehype: { footnoteLabel: '参考', footnoteBackLabel: '返回正文' },
    }),
    syntaxHighlight: false,
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
