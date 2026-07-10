# 项目优化设计

## 目标

在不改变博客视觉设计、文章正文和现有 Markdown 渲染能力的前提下，降低构建期重复工作、减少全站首屏 JavaScript、修复 Swup 生命周期问题，并统一内容可见性与专栏 URL。

## 成功标准

- `pnpm build` 完整通过。
- 公开页面不生成 `draft` 或 `unlisted` 内容。
- 专栏文章以 `/columns/{column}/{post}` 为唯一主地址。
- 原有专栏 `/posts/{slug}` 地址继续可用，并通过 canonical 与 HTML meta refresh 跳转到专栏主地址。
- 文章列表不再调用 `render(entry)` 获取阅读统计。
- Footer 的全站字数不再按页面重复计算。
- Lightbox 全局事件在多次 Swup 导航后仍只绑定一次。
- Livecodes、KaTeX、Toast 等非全站能力尽可能按需加载。
- Header 不再打包完整 Remix Icon 集合，滚动链路不再以约 60fps 触发整棵 React 消费树更新。

## 非目标

- 不迁移或重写文章正文。
- 不移除 unified Markdown 管线，也不在本轮迁移到 Sätteri。
- 不重新设计页面样式、动效或信息架构。
- 不删除仍可能作为可选功能使用的评论提供商，除非确认完全无引用。

## 实施方案

### 阶段一：低风险正确性与加载优化

1. 修正 `lint-staged` 扩展名 glob。
2. 修正 `pnpm-workspace.yaml` 中的占位值，明确允许必要构建脚本。
3. 抽取统一的文章公开性判断，供首页、专栏、RSS、归档和静态路径复用。
4. 为 `rehypeLink` 增加缺失 `href` 的防御。
5. 修复 Lightbox 重复绑定全局事件。
6. 将 Livecodes 初始化改为检测到对应 DOM 后才加载重量级模块。
7. 清除已经确认无功能的监听器和首页未使用的 collection 查询。

### 阶段二：构建与路由优化

1. 在内容层或轻量索引层计算文章字数与阅读时间，列表组件直接读取结果。
2. 建立请求进程内的内容索引缓存，统一排序、标签、分类、专栏与总字数统计。
3. 专栏文章只生成 `/columns/...` 正文页面。
4. `/posts/...` 对专栏文章生成带 canonical 与 meta refresh 的静态 HTML 跳转页，普通文章维持原路由；纯静态部署不承诺 HTTP 301。
5. 抽取唯一的 `getPostUrl()`，统一卡片、时间线、RSS 和相关链接。
6. 仅在实际需要时启用 KaTeX；若 Astro 配置无法按文章条件化，则先移除全局 CSS、保留解析兼容并记录后续迁移项。

### 阶段三：前端运行时瘦身

1. 将 Header 的静态结构与交互区域分离，优先保留 SSR HTML。
2. 将完整 Remix Icon collection 替换为按需图标数据。
3. Toast 和 Modal 改为首次使用时加载，或合并为单一轻量交互入口。
4. 将滚动状态更新改为 `requestAnimationFrame` 限流；目录激活状态使用 `IntersectionObserver`。
5. 将仅做日期、运行天数等简单展示的 React islands 改为 Astro/原生脚本。
6. 保留必要动效，但减少 Header 关键路径中的 Framer Motion 使用。

## 数据流

`Content Collection` 是文章元数据的唯一来源。标准化后的文章条目先经过公开性过滤与 URL 解析，再进入构建索引。页面、RSS、卡片和 Footer 只消费索引结果，不自行重复扫描或渲染正文。

专栏 URL 解析规则：

- 专栏条目：`/columns/{column}/{post}`
- 普通条目：`/posts/{slug}`
- 专栏旧 `/posts/{slug}`：静态 HTML 跳转到专栏 URL，并声明该 URL 为 canonical

## 错误处理

- 缺失或异常的链接属性由 Markdown 插件跳过增强，不中断构建。
- 无法解析专栏路径的条目回退到普通文章 URL，并在构建检查中报告。
- 第三方运行时加载失败时保留静态内容和可重试入口，不阻塞页面主体。

## 测试策略

优先为纯逻辑建立测试：

- `isPostPublic()` 在生产与开发环境中的 draft/unlisted 行为。
- `getPostUrl()` 对普通文章、专栏文章和自定义 slug 的输出。
- 阅读统计与总字数聚合。
- Lightbox 初始化多次时不重复绑定事件。

每阶段验证：

- `astro check`
- `astro build`
- Pagefind 索引完成
- 首页、归档、普通文章、专栏、RSS、friends、memos、bangumi 关键路由
- 构建前后总耗时、`dist` 大小和主要客户端 chunk 大小

## 风险与回滚

- 路由变更可能影响历史链接，因此保留静态 HTML 跳转页并检查 canonical、sitemap 与 RSS；若未来要求 HTTP 301，需引入 adapter/SSR 或由部署平台配置重定向。
- Header island 拆分可能影响 Swup 状态同步，因此阶段三独立实施，并在每个小改动后验证站内导航。
- Markdown 插件链属于高风险区域，本轮只做条件加载和防御性修复，不改变插件顺序或输出结构。
