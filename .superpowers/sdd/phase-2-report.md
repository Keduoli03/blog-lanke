# Phase 2 Build and Routing Report

## Status

`DONE_WITH_CONCERNS`

阶段二的文章统计、进程内缓存、PostCard 去 render、专栏排序 Map、统一文章 URL、专栏主路由与旧路由静态 HTML 跳转、Pagefind 正文标记、数学语法核验和构建基准均已实现。无 adapter 的纯静态构建不宣称 HTTP 301。未创建 commit，未修改文章正文，未回退阶段一的公开性策略、测试、Livecodes 或 Lightbox 修复。

## Modified files

- `src/utils/post-stats.ts`
  - 新增 `countPostWords()` 和 `getPostStats()`；延续原清理规则，支持中日韩字符与拉丁单词，阅读时间最低 1 分钟。
- `src/utils/post-stats.test.ts`
  - 覆盖中英混排、围栏代码、Markdown 链接和空文本。
- `src/utils/content-index.ts`
  - 使用模块级 `WeakMap` 缓存 entry 统计对象；提供总字数纯聚合 helper。
- `src/utils/content-index.test.ts`
  - 覆盖聚合结果与同一 entry 的统计对象复用。
- `src/utils/content.ts`
  - 缓存 `getPublicPosts()` Promise 和全站总字数 Promise。
  - 排序前复制共享数组，避免缓存数组被原地排序。
  - 专栏排序预建 `postsByPath` Map，删除比较器中的重复 `all.find()`。
  - 继续复用阶段一 `isPostPublic()`，未放宽 draft/unlisted。
- `src/components/post/PostCard.astro`
  - 删除 `render(entry)`，改读缓存统计；链接改用 `getPostUrl()`。
- `src/components/post/PostCard.test.ts`
  - 源码回归断言 PostCard 不 render，并读取缓存统计。
- `src/utils/post-url.ts`
  - 集中 `getEntryPath()`、`getEntrySlug()`、`slugify()`、`isColumnPost()` 和 `getPostUrl()`。
- `src/utils/post-url.test.ts`
  - 覆盖普通文章、专栏文章及自定义 slug。
- `src/components/Timeline.astro`
  - 文章链接改用 `getPostUrl()`。
- `src/components/post/PostNav.astro`
  - 对真实文章 entry 使用 `getPostUrl()`，专栏页显式 URL 仍由专栏导航数据提供。
- `src/pages/rss.xml.ts`
  - 删除内联专栏 URL 分支，统一使用 `getPostUrl()`。
- `src/utils/post-route.ts`
  - 提取 `/posts` 静态路径 props 纯映射：普通文章正文 props，专栏文章 redirect props。
- `src/utils/post-route.test.ts`
  - 覆盖普通/专栏 props、canonical + meta refresh 静态跳转和专栏 Pagefind/公开内容约束。
- `src/pages/posts/[...slug].astro`
  - 仍为所有公开文章保留旧 slug 静态路径；专栏 props 不渲染正文，而是输出 canonical、meta refresh 与可点击目标链接。
  - 正文 canonical/分享 slug 使用 `getPostUrl()`。
- `src/pages/columns/[column]/[post].astro`
  - 只消费 `getPublicPosts()`，使用 Map 定位 entry，正文容器增加 `data-pagefind-body`，canonical 使用 `getPostUrl()`。
- `src/utils/math-usage.test.ts`
  - 扫描 Markdown（排除反引号/波浪线围栏代码和行内代码）中的块级/行内数学语法；断言至少存在一个真实数学文件并保留 math 插件，不硬编码唯一文件清单。
- `docs/performance/2026-07-10-build-baseline.md`
  - 记录阶段前后构建、产物与 Pagefind 指标。

`astro.config.js` 和 `src/layouts/MarkdownLayout.astro` 本阶段未修改：扫描确认 `Blog常用书写格式记录.md` 真实使用 `$...$` 与 `$$...$$`，因此按计划保留 `remarkMath`、`rehypeKatex` 和 KaTeX CSS，以免改变现有 Markdown 输出。

## RED / GREEN evidence

### Post stats

- RED: `pnpm vitest run src/utils/post-stats.test.ts`
  - Exit 1；`Cannot find module './post-stats'`。
- GREEN: 同命令 exit 0；1 file / 3 tests passed。

### Content stats cache

- RED: `pnpm vitest run src/utils/content-index.test.ts`
  - Exit 1；`Cannot find module './content-index'`。
- GREEN: 与 post stats 联合运行 exit 0；2 files / 5 tests passed。

### PostCard render regression

- RED: `pnpm vitest run src/components/post/PostCard.test.ts`
  - Exit 1；源码仍包含 `render(entry)`。
- GREEN: 同命令 exit 0；1 file / 1 test passed。

### Unified post URL

- RED: `pnpm vitest run src/utils/post-url.test.ts`
  - Exit 1；`Cannot find module './post-url'`。
- GREEN: 同命令 exit 0；1 file / 3 tests passed。

### Post route mapping

- RED: `pnpm vitest run src/utils/post-route.test.ts`
  - Exit 1；`Cannot find module './post-route'`。
- GREEN: 初始行为测试 1 file / 2 tests passed；复核后改为 canonical + meta refresh、公开内容与 Pagefind 源码回归。

### Math usage

- 首次扫描 RED：预期存在的数学文章未被识别。原因是朴素围栏清理被正文中的 `` ` ```math ` `` 示例干扰，将后续真实公式一并吞掉。
- 修正为逐行围栏状态扫描后 GREEN：识别清单为 `Blog常用书写格式记录.md`；1 file / 1 test passed。
- 因清单非空，没有移除 KaTeX 链路。

## Build baseline

| Metric                 |     Before |      After |            Change |
| ---------------------- | ---------: | ---------: | ----------------: |
| `pnpm build` total     |   45.632 s |   44.129 s | -1.503 s (-3.29%) |
| Astro page build       |    12.57 s |    11.86 s |  -0.71 s (-5.65%) |
| Generated pages        |        111 |        111 |                 0 |
| `dist` files           |        333 |        333 |                 0 |
| `dist` bytes           | 11,353,852 | 11,353,834 |               -18 |
| Pagefind indexed pages |         54 |         54 |                 0 |
| Pagefind indexed words |      8,111 |      8,111 |                 0 |

单次本地样本仅用于阶段记录，不代表统计显著的性能结论。

## Final commands

- `pnpm vitest run`
  - Exit 0；复核调整后的最终回归 10 files / 21 tests passed。
- `pnpm astro check`
  - Exit 0；0 errors，Astro 汇总 50 个既有 hints。
- `pnpm build`
  - Exit 0；111 pages；Pagefind 54 pages / 8111 words。
- `pnpm check:build-assets`
  - Exit 0；`Browser assets: compiled JavaScript verified.`。
- IDE diagnostics
  - 本阶段生产文件无 linter errors。

## Route artifact evidence

- RSS: `dist/rss.xml` 正常生成；普通文章 `Blog常用书写格式记录` 指向 `/posts/blog-chang-yong-shu-xie-ge-shi-ji-lu/`。
- Sitemap: `dist/sitemap-index.xml` 指向 `sitemap-0.xml`；普通正文 URL 存在，未出现同一公开正文的 columns/posts 双正文地址。
- 普通文章: `dist/posts/blog-chang-yong-shu-xie-ge-shi-ji-lu/index.html` 存在，title、canonical 与正文页面正常。
- 专栏入口: `dist/columns/index.html` 存在。
- 计划抽样的专栏 `GET与POST请求`：
  - 预期主产物 `dist/columns/java/GET与POST请求/index.html` 不存在。
  - 预期旧地址产物 `dist/posts/974408/index.html` 不存在。
  - 该条目使用 legacy `status: false`，schema 将其转换为 `draft: true`。全体 22 个专栏文件中，2 个是该 legacy 情况，16 个显式 `draft: true`，其余 4 个为 `draft: false` 但 `unlisted: true`；共有 19 个文件设置 `unlisted: true`，与 draft 组有重叠。生产构建按阶段一策略分别排除 draft 和 unlisted，并非所有文件都由 `status: false` 隐藏。
  - 纯路由测试确认同一 entry 映射到 `/columns/java/GET与POST请求`，旧 `/posts/974408` 路由 props 为 redirect，页面源码输出 canonical + meta refresh 静态 HTML；待内容层首次公开专栏后即可得到对应静态产物。

## Concerns

- 当前内容集没有公开专栏文章，因此无法在不回退阶段一公开性策略、也不修改文章 frontmatter 的前提下生成并实查专栏正文与旧地址静态 HTML 跳转页。此项保留为明确的内容前置条件；实现由纯函数、源码回归、Astro 类型检查和完整构建覆盖。
- KaTeX 不能按“全站无使用”路径移除：`Blog常用书写格式记录.md` 有真实行内和块级公式。为保持 unified Markdown 输出及页面样式，本阶段保留全局解析与 CSS；按文章条件加载仍可作为后续独立优化。
- 构建仍输出阶段前已有的 hints/warnings（空 friends collection、content `z` deprecation、Lightbox CSS minify、大 chunk 等）；本阶段未扩大范围处理。
- 工作树在阶段开始前已有大量用户修改与未跟踪构建产物；本阶段没有清理、格式化或回退这些文件。`git diff --check` 会报告用户文章中的既有尾随空格，未据此修改正文。

## Phase 2 review adjustment: static redirect semantics

### Root cause

当前项目保持 Astro 纯静态输出且没有 adapter。`Astro.redirect(redirect, 301)` 在该构建形态下不能兑现部署时的 HTTP 301 响应保证；阶段二原实现与报告把框架 API 参数误写成了可验证的线上状态码语义。

推荐默认保持纯静态架构：旧 `/posts/{slug}` 专栏页面输出以下 HTML 语义：

- 指向 `/columns/{column}/{post}` 的 canonical。
- `http-equiv="refresh"` 即时跳转。
- 无脚本/未自动跳转时仍可点击的目标链接。
- 不声明 HTTP 301；未来若需要状态码级重定向，应由 adapter/SSR 或部署平台规则提供。

### Revised RED / GREEN

调整后的行为测试先替换旧 301 断言，并新增 `~~~` fence 场景：

```text
pnpm vitest run src/utils/post-route.test.ts src/utils/math-usage.test.ts
Exit 1
2 failed / 3 passed
- 路由源码仍包含 Astro.redirect
- ~~~ fence 中的 $hidden$ 被误识别为数学语法
```

实现静态 HTML 跳转并让数学扫描器分别跟踪反引号/波浪线 fence 后：

```text
pnpm vitest run src/utils/post-route.test.ts src/utils/math-usage.test.ts
Exit 0
2 files / 5 tests passed
```

数学使用断言现在只要求检测到至少一个真实数学文件，并验证 `remarkMath`、`rehypeKatex` 与 KaTeX CSS 仍保留；新增合法数学文章不会导致唯一清单断言失败。

### Public column visibility correction

`src/content/posts/专栏` 当前共有 22 个 Markdown 文件：

- 2 个使用 legacy `status: false`，schema 将其转换为 `draft: true`。
- 16 个显式设置 `draft: true`。
- 其余 4 个显式 `draft: false`，但同时设置 `unlisted: true`。
- `unlisted: true` 共出现于 19 个文件，与 draft 文件存在重叠。

因此“全部专栏由 `status: false` 隐藏”的旧归因错误。准确原因是阶段一策略分别过滤转换/显式 draft 与 unlisted，最终没有公开专栏。

### Review verification

- `pnpm vitest run`: exit 0；10 files / 21 tests passed。
- `pnpm astro check`（相关测试后的串行检查及 build 内检查）: exit 0；0 errors。
- `pnpm build`: exit 0；111 HTML；Pagefind 54 pages / 8111 words。
- `pnpm check:build-assets`: exit 0；compiled JavaScript verified。
- 没有修改文章或创建 commit。
