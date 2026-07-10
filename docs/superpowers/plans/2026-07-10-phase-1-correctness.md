# Phase 1 Correctness and Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复公开性、配置、Markdown 防御与 Swup 监听问题，并移除已确认的无效构建工作。

**Architecture:** 将文章可见性收敛为纯函数，由所有 collection 查询复用；事件型运行时保持单例绑定；重量模块先检测 DOM 再导入。修改保持局部，不调整 Markdown 输出和页面样式。

**Tech Stack:** Astro 7、TypeScript、Vitest、pnpm、Swup

## Global Constraints

- 不修改文章正文和视觉设计。
- 保留 unified Markdown 管线及插件顺序。
- 生产环境不生成 `draft` 或 `unlisted` 页面。
- 所有新增行为先写失败测试。

---

### Task 1: 建立纯逻辑测试入口

**Files:**

- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/utils/post-policy.ts`
- Test: `src/utils/post-policy.test.ts`

**Interfaces:**

- Produces: `isPostPublic(data: { draft?: boolean; unlisted?: boolean }, isProd: boolean): boolean`

- [ ] **Step 1: 安装测试依赖并写失败测试**

Run: `pnpm add -D vitest jsdom`

```ts
import { describe, expect, it } from 'vitest'
import { isPostPublic } from './post-policy'

describe('isPostPublic', () => {
  it('hides drafts in production', () => {
    expect(isPostPublic({ draft: true }, true)).toBe(false)
  })
  it('hides unlisted posts in every environment', () => {
    expect(isPostPublic({ unlisted: true }, false)).toBe(false)
  })
  it('keeps drafts visible in development', () => {
    expect(isPostPublic({ draft: true }, false)).toBe(true)
  })
})
```

- [ ] **Step 2: 验证测试因模块缺失而失败**

Run: `pnpm vitest run src/utils/post-policy.test.ts`  
Expected: FAIL，提示无法解析 `./post-policy`。

- [ ] **Step 3: 实现最小策略函数**

```ts
export function isPostPublic(data: { draft?: boolean; unlisted?: boolean }, isProd: boolean) {
  if (data.unlisted) return false
  if (isProd && data.draft) return false
  return true
}
```

- [ ] **Step 4: 接入所有公开 collection 查询**

在 `src/utils/content.ts` 中让 `getPublicPosts()` 与 `getColumnsFromFolder()` 使用同一过滤结果；删除只过滤 draft 的私有 `getAllPosts()`。

- [ ] **Step 5: 验证**

Run: `pnpm vitest run src/utils/post-policy.test.ts && pnpm astro check`  
Expected: 测试通过，Astro 无 error。

### Task 2: 修复 Markdown 链接防御

**Files:**

- Modify: `src/plugins/rehypeLink.js:4-18`
- Test: `src/plugins/rehypeLink.test.ts`

**Interfaces:**

- Consumes: 现有 `rehypeLink()` transformer

- [ ] **Step 1: 写缺少 href 的失败测试**

构造包含 `{ tagName: 'a', properties: {}, children: [] }` 的 HAST root，执行 transformer，并断言不抛异常。

- [ ] **Step 2: 验证当前实现抛出 `startsWith` 错误**

Run: `pnpm vitest run src/plugins/rehypeLink.test.ts`  
Expected: FAIL with `Cannot read properties of undefined`.

- [ ] **Step 3: 加最小守卫**

```js
const href = node.properties?.href
if (typeof href !== 'string') return
const isExternal = href.startsWith('http')
```

- [ ] **Step 4: 验证**

Run: `pnpm vitest run src/plugins/rehypeLink.test.ts`  
Expected: PASS。

### Task 3: Lightbox 全局事件只绑定一次

**Files:**

- Modify: `src/scripts/lightbox.ts:13-78`
- Test: `src/scripts/lightbox.test.ts`

**Interfaces:**

- Produces: 幂等的 `Lightbox.init()`

- [ ] **Step 1: 写失败测试**

在 jsdom 环境 spy `document.addEventListener` 与 `window.addEventListener`，构造实例后再次调用 `init()`，断言第二次不会增加 click/keydown/drag 监听。

- [ ] **Step 2: 验证失败**

Run: `pnpm vitest run --environment jsdom src/scripts/lightbox.test.ts`  
Expected: FAIL，监听调用数增加。

- [ ] **Step 3: 实现单次绑定**

新增 `private eventsBound = false`；`bindGlobalEvents()` 首行在已绑定时返回，首次绑定后设为 `true`。将 `.bind(this)` 结果保存为类字段，确保后续可清理。

- [ ] **Step 4: 验证**

Run: `pnpm vitest run --environment jsdom src/scripts/lightbox.test.ts`  
Expected: PASS。

### Task 4: 配置与无效工作清理

**Files:**

- Modify: `package.json:79`
- Modify: `pnpm-workspace.yaml`
- Modify: `src/pages/[...page].astro:6-13,40-42`
- Modify: `src/layouts/Layout.astro:16,47-51`

- [ ] **Step 1: 修正配置**

将 lint-staged glob 改为 `*.{js,jsx,ts,tsx,astro,md,css,json}`；将 `allowBuilds` 的 `esbuild`、`sharp`、`simple-git-hooks` 全部设为 `true`。

- [ ] **Step 2: 删除首页未使用查询和 import**

移除 `getHotTags/getAllCategories/getAllTags`、`TagList`、`CategoryList`、`Icon` 及对应调用。

- [ ] **Step 3: Livecodes 改为 DOM 存在时加载**

内联启动脚本先执行 `document.querySelector('.livecodes-runner')`；不存在时直接返回，存在时再 `import(livecodesScriptUrl)`。在 `astro:page-load` 重复执行同一检测函数。

- [ ] **Step 4: 阶段验证**

Run: `pnpm vitest run && pnpm build`  
Expected: 全部测试与构建通过；首页不加载 Livecodes chunk，含 runner 的文章仍能初始化。
