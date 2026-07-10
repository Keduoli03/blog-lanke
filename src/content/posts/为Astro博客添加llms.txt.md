---
title: 为 Astro 博客添加 llms.txt
summary: 参考 llmstxt.org 规范，为 Astro 静态博客生成面向 LLM 的站点索引与 Markdown 原文导出。
category: 博客
tags:
  - Astro
  - llms.txt
  - SEO
date: '2026-07-10 22:30'
updated: '2026-07-10 22:30'
slug: astro-llms-txt
---

> [!TIP]
> 本站已上线 `/llms.txt`、`/llm.txt`（别名）与 `/llms-full.txt`，每篇文章也可通过在原 URL 后追加 `.md` 获取 Markdown 原文，例如 [本文 Markdown 版](/posts/astro-llms-txt.md)。

## 什么是 llms.txt

`llms.txt` 是放在网站根目录的一份 **Markdown 索引文件**，规范见 [llmstxt.org](https://llmstxt.org/)。它和 `robots.txt`、`sitemap.xml` 类似，都约定在固定路径访问，但服务对象不同：

| 文件          | 主要用途                                        |
| ------------- | ----------------------------------------------- |
| `robots.txt`  | 告诉爬虫哪些路径可以抓取                        |
| `sitemap.xml` | 列出站点全部可索引 URL                          |
| `llms.txt`    | 为 LLM 提供**精简、结构化**的站点说明与关键链接 |

搜索引擎需要「尽可能全」的页面列表；LLM 的上下文窗口有限，更需要一份**人工筛选过**的导读，而不是把整个 sitemap 塞进去。

规范要求的核心结构如下：

```markdown
# 站点名称

> 一句话简介

补充说明段落（可选）

## 某个主题

- [链接标题](https://example.com/page): 可选说明

## Optional

- [次要链接](https://example.com/extra)
```

其中 `## Optional` 有特别含义：上下文紧张时，可以跳过这一节的链接。

## 为什么 Astro 博客适合加这个

Astro 的内容都在 `src/content` 里，构建时已经能拿到全部文章的标题、摘要、分类、标签和正文。相比运行时拼 HTML 再让模型「猜」结构，在构建阶段直接生成 `llms.txt` 和 `.md` 原文更干净，也和本站已有的 `robots.txt.ts`、`rss.xml.ts` 一脉相承。

本方案实现了三件事：

1. **`/llms.txt`**：精选页面 + 最新/置顶文章 + 专栏/分类索引
2. **`/llms-full.txt`**：列出全部公开文章
3. **`/posts/{slug}.md`、`/columns/{column}/{post}.md`**：按 llmstxt.org 建议，在 HTML 同路径追加 `.md` 提供纯净 Markdown

另外提供 **`/llm.txt`** 作为常见笔误别名，内容与 `llms.txt` 相同。

## 实现步骤

### 1. 生成 llms.txt 内容

新建 `src/utils/llms.ts`，在构建时读取站点配置与公开文章，拼出符合规范的 Markdown 字符串。核心逻辑是复用现有的内容工具：

- `getSortedPosts()`：按置顶、日期排序的公开文章
- `getColumnsFromFolder()`：专栏结构
- `getAllCategories()`：分类列表
- `getPostUrl()`：统一文章 URL（普通文章 `/posts/...`，专栏 `/columns/...`）

文章链接指向 **`.md` 版本**，方便 LLM 直接读取正文，而不是解析 HTML 页面。

### 2. 暴露 API 端点

在 `src/pages/` 下新增端点文件（与 `robots.txt.ts` 同级）：

```ts title="src/pages/llms.txt.ts"
import type { APIRoute } from 'astro'
import { buildLlmsTxt } from '@/utils/llms'

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href ?? import.meta.env.SITE
  const body = await buildLlmsTxt(siteUrl)

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
```

`llms-full.txt.ts` 只需传入 `{ full: true }`，在 `## 全部文章` 一节列出所有公开文章。

### 3. 为文章提供 .md 导出

规范建议：信息页面在**相同 URL** 后加 `.md`。对 Astro 博客可以新增：

- `src/pages/posts/[...slug].md.ts`：普通文章
- `src/pages/columns/[column]/[post].md.ts`：专栏文章

共用的格式化函数放在 `src/utils/post-markdown.ts`：

```ts title="src/utils/post-markdown.ts"
export function formatPostMarkdown(post) {
  // 输出 # 标题、摘要 blockquote、元信息、原始 Markdown 正文
}
```

`getStaticPaths` 里只包含公开文章；专栏文章走 columns 路由，避免和 `/posts` 重定向逻辑打架。

### 4. 验证

本地构建后检查：

```bash
pnpm build
pnpm preview
```

浏览器或 `curl` 访问：

- `http://localhost:4321/llms.txt`
- `http://localhost:4321/llms-full.txt`
- `http://localhost:4321/posts/astro-llms-txt.md`

确认响应头为 `text/markdown; charset=utf-8`，且链接域名与 `astro.config` 里的 `site` 一致。

## 和 robots.txt / sitemap 的关系

三者互补，不需要互相替代：

- **robots.txt**：控制爬虫抓取策略（本站实现见 `src/pages/robots.txt.ts`）
- **sitemap.xml**：由 `@astrojs/sitemap` 自动生成完整 URL 列表
- **llms.txt**：给 LLM 的「阅读指南」，只放高价值入口

如果希望主动告知 AI 产品，还可以在关于页或站点 README 里写上 `https://你的域名/llms.txt`。规范仍在演进，不必过度设计自动发现机制。

## 可选增强

1. **在 `<head>` 增加 `<link rel="alternate" type="text/markdown" href="...md" />`**，提示存在 Markdown 版本
2. **按分类拆分多个 llms 文件**，例如 `/llms-dev.txt` 只列技术文章
3. **用 [llms_txt2ctx](https://llmstxt.org/)** 把 `llms.txt` 展开成更大的上下文文件，供 Claude 等工具导入
4. **draft / unlisted 策略**：与线上一致，生产环境不导出草稿；本站通过 `isPostPublic()` 与 `unlisted` 字段控制

## 小结

为 Astro 博客添加 `llms.txt` 的成本不高：一个内容拼装函数、两三个 API 路由、可选的文章 `.md` 导出。收益是当用户把站点交给 AI 分析时，模型能先读索引、再按需打开 Markdown 正文，比直接爬 HTML 省 token，也更准确。

本站相关源码：

- `src/utils/llms.ts` — 索引生成
- `src/utils/post-markdown.ts` — 文章 Markdown 导出
- `src/pages/llms.txt.ts`、`llm.txt.ts`、`llms-full.txt.ts`
- `src/pages/posts/[...slug].md.ts`、`src/pages/columns/[column]/[post].md.ts`

## 参考

- [llmstxt.org 规范](https://llmstxt.org/)
- [为 Astro 博客添加 llms.txt（腾讯云社区）](https://cloud.tencent.com/developer/article/2690303)
- [本站 llms.txt](/llms.txt)
- [本站 llms-full.txt](/llms-full.txt)
