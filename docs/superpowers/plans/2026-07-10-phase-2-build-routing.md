# Phase 2 Build and Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除文章列表和 Footer 的重复正文处理，并将专栏 URL 收敛到 `/columns/...`。

**Architecture:** 把字数、阅读时间与 URL 解析做成纯函数；单次加载公开文章后建立可复用索引。普通文章由 `/posts/...` 渲染，专栏文章在该路由只输出带 canonical 与 meta refresh 的静态 HTML 跳转页。

**Tech Stack:** Astro Content Collections、TypeScript、Vitest、静态路由

## Global Constraints

- 专栏主地址固定为 `/columns/{column}/{post}`。
- 旧 `/posts/{slug}` 必须继续可访问并以静态 HTML 跳转到主地址；无 adapter 的静态构建不承诺 HTTP 301。
- 不改变正文 Markdown 渲染结果。
- 统计逻辑需要支持中日韩字符和拉丁单词。

---

### Task 1: 提取文章统计纯函数

**Files:**

- Create: `src/utils/post-stats.ts`
- Test: `src/utils/post-stats.test.ts`
- Modify: `src/utils/content.ts`

**Interfaces:**

- Produces: `countPostWords(body: string): number`
- Produces: `getPostStats(body: string): { words: number; readingMinutes: number }`

- [ ] **Step 1: 写失败测试**

覆盖中文、英文、代码块、Markdown 链接和空文本；断言 `中文 test` 为 3 个词，代码块内容不计入，阅读时间至少为 1 分钟。

- [ ] **Step 2: 验证失败**

Run: `pnpm vitest run src/utils/post-stats.test.ts`  
Expected: FAIL，模块不存在。

- [ ] **Step 3: 移动现有计字逻辑并实现阅读时间**

复用 `content.ts` 现有清理正则；`readingMinutes` 使用 `Math.max(1, Math.ceil(words / 300))`。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run src/utils/post-stats.test.ts`  
Expected: PASS。

### Task 2: 建立进程内文章索引

**Files:**

- Modify: `src/utils/content.ts`
- Test: `src/utils/content-index.test.ts`

**Interfaces:**

- Produces: `getPostStatsForEntry(entry): { words: number; readingMinutes: number }`
- Produces: `getAllPostsWordCount(): Promise<number>`

- [ ] **Step 1: 写聚合失败测试**

对两个最小 entry body 调用纯聚合 helper，断言总字数等于各自统计之和，并断言同一 entry 的统计对象可复用。

- [ ] **Step 2: 实现缓存**

使用模块级 `WeakMap<object, PostStats>` 缓存 entry 统计；`getAllPostsWordCount()` 加模块级 Promise 缓存，避免 Footer 在多个页面重复扫描。

- [ ] **Step 3: 优化专栏排序**

在 `getColumnsFromFolder()` 中预建 `Map(getEntryPath(entry), entry)`，替换 sort 比较器内的多次 `all.find()`。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run src/utils/post-stats.test.ts src/utils/content-index.test.ts`  
Expected: PASS。

### Task 3: PostCard 不再 render

**Files:**

- Modify: `src/components/post/PostCard.astro:2-16,36-42`

- [ ] **Step 1: 增加源码回归测试**

读取 `PostCard.astro`，断言不包含 `render(entry)`，且包含 `getPostStatsForEntry(entry)`。先运行并确认失败。

- [ ] **Step 2: 替换实现**

删除 `render` import；调用 `const { words, readingMinutes } = getPostStatsForEntry(entry)`，传给 `PostMetaInfo`。

- [ ] **Step 3: 验证**

Run: `pnpm vitest run && pnpm astro check`  
Expected: PASS，无类型错误。

### Task 4: 统一文章 URL

**Files:**

- Create: `src/utils/post-url.ts`
- Test: `src/utils/post-url.test.ts`
- Modify: `src/pages/rss.xml.ts`
- Modify: `src/components/post/PostCard.astro`
- Modify: `src/components/Timeline.astro`

**Interfaces:**

- Produces: `getPostUrl(entry): string`
- Produces: `isColumnPost(entry): boolean`

- [ ] **Step 1: 写失败测试**

断言 `专栏/Java/GET与POST请求` 输出 `/columns/java/GET与POST请求`；普通 entry 输出 `/posts/{slug}`；自定义 slug 只影响普通文章 URL。

- [ ] **Step 2: 实现 URL helper**

从 `getEntryPath()` 分段；根目录为 `专栏` 或 `column` 且至少三段时返回 columns URL，否则调用 `getEntrySlug()`。

- [ ] **Step 3: 替换 RSS、PostCard、Timeline 的内联 URL 逻辑**

所有文章入口统一调用 `getPostUrl(entry)`。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run src/utils/post-url.test.ts`  
Expected: PASS。

### Task 5: `/posts` 对专栏输出静态 HTML 跳转

**Files:**

- Modify: `src/pages/posts/[...slug].astro:21-63`
- Modify: `src/pages/columns/[column]/[post].astro:15-28,106`

- [ ] **Step 1: 写静态路径行为测试**

将路径映射抽为纯 helper，断言普通文章 props 为正文，专栏文章 props 含 `redirect: getPostUrl(post)`；源码回归断言跳转页包含 canonical 与 meta refresh，且不宣称 HTTP 301。

- [ ] **Step 2: 修改 posts 静态路径**

所有公开文章仍生成旧 slug；专栏条目的 props 只包含 `redirect`。组件不渲染文章正文，而是输出 canonical、`http-equiv="refresh"` 和可点击目标链接组成的静态 HTML 页面。

- [ ] **Step 3: 完善专栏正文页**

让专栏 `getStaticPaths` 只消费 `getPublicPosts()`；正文主容器增加 `data-pagefind-body`。

- [ ] **Step 4: 构建并检查输出**

Run: `pnpm build`  
Expected: 普通文章生成正文；专栏 `/columns/...` 生成正文并进入 Pagefind；对应 `/posts/...` 输出带 canonical 与 meta refresh 的静态 HTML 跳转页面。

### Task 6: 阶段基准

**Files:**

- Modify: `astro.config.js`
- Modify: `src/layouts/MarkdownLayout.astro`
- Test: `src/utils/math-usage.test.ts`

- [ ] **Step 1: 验证数学语法使用情况**

扫描 `src/content/posts/**/*.md` 中的块级 `$$` 与行内 `$...$`，测试输出实际使用文件清单。若清单为空，测试断言配置不再包含 `remarkMath`、`rehypeKatex`，且 MarkdownLayout 不全局导入 KaTeX CSS。

- [ ] **Step 2: 先运行测试确认失败**

Run: `pnpm vitest run src/utils/math-usage.test.ts`  
Expected: FAIL，当前配置仍全局启用 KaTeX。

- [ ] **Step 3: 移除无使用的全局数学链路**

在确认内容扫描为空后，删除 Astro 配置中的 `remarkMath`、`rehypeKatex` 及其 import，并移除 MarkdownLayout 的 `katex.min.css` import；保留依赖到最终构建验证后再决定是否卸载。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run src/utils/math-usage.test.ts && pnpm build`  
Expected: PASS，文章构建结果正常。

### Task 7: 阶段基准

**Files:**

- Create: `docs/performance/2026-07-10-build-baseline.md`

- [ ] **Step 1: 记录结果**

记录冷构建总耗时、`dist` 文件数量与大小、Pagefind 索引页数，并与阶段开始前日志对比。

- [ ] **Step 2: 完整验证**

Run: `pnpm vitest run && pnpm build`  
Expected: 全绿；无重复正文 URL 出现在 sitemap/RSS。
