# Phase 3 Runtime Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留现有外观与交互，同时减少首屏 JavaScript、图标数据和滚动主线程工作。

**Architecture:** 优先让 Header 通过 React SSR 输出可用 HTML，再逐步缩小需要水合的交互范围；图标改为显式按需数据；滚动状态采用 rAF，目录在内容稳定时缓存标题文档 offset，滚动帧通过二分查找 active heading，避免逐帧布局循环。

**Tech Stack:** Astro islands、React 19、Jotai、Iconify、requestAnimationFrame、Swup

## Global Constraints

- 页面视觉与菜单功能保持不变。
- JS 未加载时 Header 的主要导航仍可见。
- 支持 Swup 页面切换后的重新初始化。
- 尊重 `prefers-reduced-motion`。

---

### Task 1: Header 从 client-only 改为 SSR + hydration

**Files:**

- Modify: `src/layouts/PageLayout.astro:17-20`
- Modify: `src/layouts/MarkdownLayout.astro:21-30`
- Test: `src/layouts/header-hydration.test.ts`

- [ ] **Step 0: 安装 React DOM 测试依赖**

Run: `pnpm add -D @testing-library/react jsdom`

- [ ] **Step 1: 写源码行为失败测试**

读取两个 layout，断言 Header 使用 `client:load` 而不是 `client:only="react"`；Provider 仍可保留 client-only，因为其不渲染 UI。

- [ ] **Step 2: 验证失败**

Run: `pnpm vitest run src/layouts/header-hydration.test.ts`  
Expected: FAIL。

- [ ] **Step 3: 修改 Header directive**

将 `<Header client:only="react" />` 改为 `<Header client:load />`。若 SSR 暴露 `window` 访问，将访问移动到 effect 或使用安全初始值，不回退到 client-only。

- [ ] **Step 4: 验证 SSR**

Run: `pnpm build`  
Expected: 生成 HTML 中包含 header/nav 文本，构建无 `window is not defined`。

### Task 2: 图标按需导入

**Files:**

- Modify: `src/icons/ri.ts`
- Modify: 所有引用 `src/icons/registerRi.ts` 的 React 组件
- Delete: `src/icons/registerRi.ts`
- Test: `src/icons/ri.test.ts`

- [ ] **Step 1: 写失败测试**

扫描 `src/components/**/*.{ts,tsx}`，断言不存在 `registerRi` import；断言 `ri.ts` 不导出运行时 `addCollection`。

- [ ] **Step 2: 验证失败**

Run: `pnpm vitest run src/icons/ri.test.ts`  
Expected: FAIL，找到多个 `registerRi` import。

- [ ] **Step 3: 替换使用点**

每个 `<Icon icon="ri:name" />` 改为从 `@/icons/ri` 导入对应 icon data 并传入。为缺少的名称在 `ri.ts` 增加显式常量。

- [ ] **Step 4: 删除完整集合注册**

删除所有 `registerRi` import 后删除文件；保留 `@iconify-json/ri` 作为构建期图标源。

- [ ] **Step 5: 验证**

Run: `pnpm vitest run src/icons/ri.test.ts && pnpm build`  
Expected: PASS，主要 Header chunk 不包含完整 collection 注册代码。

### Task 3: 滚动 Provider 使用 rAF 合并更新

**Files:**

- Modify: `src/components/provider/PageScrollInfoProvider.tsx`
- Test: `src/components/provider/PageScrollInfoProvider.test.tsx`

- [ ] **Step 1: 写失败测试**

模拟同一帧内触发三次 scroll，断言只安排一个 `requestAnimationFrame`；卸载时断言取消待执行 frame。

- [ ] **Step 2: 验证失败**

Run: `pnpm vitest run --environment jsdom src/components/provider/PageScrollInfoProvider.test.tsx`  
Expected: FAIL，当前实现使用 lodash throttle。

- [ ] **Step 3: 实现 rAF**

使用 `frameRef` 防止重复排队；scroll listener 设 `{ passive: true }`；effect cleanup 中移除监听并 `cancelAnimationFrame`。移除本文件的 lodash import。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run --environment jsdom src/components/provider/PageScrollInfoProvider.test.tsx`  
Expected: PASS。

### Task 4: TOC 使用缓存 offset + rAF 二分查找

**Files:**

- Modify: `src/components/post/PostToc.tsx:1-31`
- Test: `src/components/post/PostToc.test.tsx`

- [x] **Step 1: 写失败测试**

为 headings 提供真实的文档 offset 测试数据，覆盖首标题前为空、向下跨标题、长章节保持、向上立即回前一标题、同一帧多个 scroll 只安排一个 rAF，以及 cleanup 取消 frame/移除监听。覆盖 resize、`astro:page-load` 和 `swup:contentReplaced` 后重新测量。

- [x] **Step 2: 验证失败**

Run: `pnpm vitest run --environment jsdom src/components/post/PostToc.test.tsx`  
Expected: FAIL；旧 IntersectionObserver 状态机不监听 scroll/rAF，也不消费缓存 offset。

- [x] **Step 3: 替换 active heading 算法**

mount 后在下一帧一次性读取 headings 的 `getBoundingClientRect().top + scrollY`，按 offset 排序缓存。passive scroll listener 每帧只读取一次 `scrollY`，二分查找最后一个 `offset <= scrollY + 80` 的 heading。resize、Astro page-load 和 Swup content-replaced 事件仅标记下一帧重新测量；cleanup 移除监听并取消待执行 frame。PostToc 不读取全局 PageScrollInfoProvider atom。

- [x] **Step 4: 改善可访问性**

非 active TOC 文本默认使用可见的低透明度，并增加 `focus-visible:opacity-100`，不再默认 `opacity-0`。

- [x] **Step 5: 验证**

Run: `pnpm vitest run --environment jsdom src/components/post/PostToc.test.tsx`  
Expected: PASS。

### Task 5: 简单展示移出 React island

**Files:**

- Modify: `src/components/footer/Footer.astro`
- Replace: `src/components/footer/RunningDays.tsx` with `src/components/footer/RunningDays.astro`
- Modify: `src/components/post/PostMetaInfo.astro`

- [ ] **Step 1: 为静态输出写失败测试**

断言 Footer 不包含 `RunningDays client:only`；文章列表不为每篇创建 `RelativeDate client:idle`。

- [ ] **Step 2: 实现 Astro 输出**

RunningDays 在服务端根据 startTime 输出整天数；日期使用 `<time datetime>` 输出稳定绝对日期，避免多个 React island。

- [ ] **Step 3: 验证**

Run: `pnpm vitest run && pnpm build`  
Expected: 列表无 RelativeDate island，Footer 无 RunningDays island。

### Task 6: 全局交互按需化

**Files:**

- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/ToastContainer.tsx`
- Modify: 调用 toast/modal 的组件

- [ ] **Step 1: 统计实际调用点**

使用代码搜索确认 toast 与 modal 的所有入口，记录在测试 fixture 中。

- [ ] **Step 2: 写失败测试**

断言 Layout 不包含全局 `ToastContainer client:only`；首次触发复制/分享时仍能显示反馈。

- [ ] **Step 3: 实现按需入口**

将反馈 UI 合并到实际需要它的 island，或动态 import `react-toastify`；ModalStack 仅在存在 modal 触发器的页面加载。

- [ ] **Step 4: 最终验证**

Run: `pnpm vitest run && pnpm build`  
Expected: 全绿；首页 HTML 有 Header；无全量 RI collection；全站基础导航、搜索、抽屉、TOC、返回顶部、分享与 Swup 切页可用。

### Task 7: 缩减 Header 关键路径动画

**Files:**

- Modify: `src/components/header/AnimatedLogo.tsx`
- Modify: `src/components/header/HeaderMeta.tsx`
- Modify: `src/components/header/BluredBackground.tsx`
- Modify: `src/components/header/HeaderContent.tsx`

- [ ] **Step 1: 建立 reduced-motion 回归测试**

mock `matchMedia('(prefers-reduced-motion: reduce)')` 为 true，渲染 Header，断言核心导航和 Logo 可见且不依赖动画完成回调。

- [ ] **Step 2: 使用 CSS 处理简单过渡**

将仅做 opacity、translate、color 的 Framer Motion 节点替换为普通元素和现有 Tailwind transition；抽屉与复杂 presence 动画保留 Framer Motion。

- [ ] **Step 3: 增加 reduced-motion 样式**

在 Header 动效类上使用 `motion-reduce:transition-none` 和 `motion-reduce:transform-none`，移动端模糊背景在 reduced-motion 下改为稳定半透明背景。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run && pnpm build`  
Expected: Header 功能不变，简单动画不再从首屏代码路径导入 Framer Motion。

### Task 8: 运行时基准

**Files:**

- Modify: `docs/performance/2026-07-10-build-baseline.md`

- [ ] **Step 1: 记录指标**

记录首页客户端 JS 总量、最大 chunk、冷加载请求数，并与阶段二基准比较。

- [ ] **Step 2: 浏览器关键路径检查**

依次访问 `/`、`/archives`、普通文章、专栏文章、`/memos`、`/bangumi`，每次通过站内 Swup 导航进入与离开；控制台不得出现重复监听、hydration 或未捕获异常。
