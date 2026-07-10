# Phase 1 Correctness and Loading Report

## Status

`DONE_WITH_CONCERNS`

阶段一计划中的公开性策略、Markdown 链接防御、Lightbox 幂等绑定、配置修正、首页死查询清理和 Livecodes 条件加载均已实施。未创建 commit，未修改文章正文，也未回退仓库中已有的 Astro 7 或内容改动。

## Modified files

- `package.json`
  - 新增 `vitest`、`jsdom` 开发依赖。
  - 修正 lint-staged glob 为 `*.{js,jsx,ts,tsx,astro,md,css,json}`。
- `pnpm-lock.yaml`
  - 由 `pnpm add -D vitest jsdom` 更新；保留了任务开始前已有的升级改动。
- `pnpm-workspace.yaml`
  - 将 `esbuild`、`sharp`、`simple-git-hooks` 的 `allowBuilds` 值设为 `true`。
- `vitest.config.ts`
  - 建立 `src/**/*.test.ts` 测试入口。
- `src/utils/post-policy.ts`
  - 新增纯函数 `isPostPublic()`。
- `src/utils/post-policy.test.ts`
  - 覆盖生产 draft、全环境 unlisted、开发 draft 三种公开性行为。
- `src/utils/content.ts`
  - `getPublicPosts()` 复用 `isPostPublic()`。
  - `getColumnsFromFolder()` 改用 `getPublicPosts()`，并删除仅过滤 draft 的私有 `getAllPosts()`。
- `src/plugins/rehypeLink.test.ts`
  - 覆盖 `<a>` 缺失 `href` 时不抛异常。
- `src/plugins/rehypeLink.js`
  - 对非字符串 `href` 提前返回。
- `src/scripts/lightbox.test.ts`
  - 覆盖构造后再次 `init()` 不新增 document/window 全局监听。
- `src/scripts/lightbox.ts`
  - 增加实例级 `eventsBound` 守卫。
  - 缓存所有 `.bind(this)` 后的处理器引用。
- `src/pages/[...page].astro`
  - 删除首页未使用的 tag/category 查询与相关 import。
- `src/layouts/Layout.astro`
  - 仅检测到 `.livecodes-runner` 后才动态导入 Livecodes，并在 `astro:page-load` 重复执行同一检测函数。

## TDD evidence

### Public post policy

RED:

```text
pnpm vitest run src/utils/post-policy.test.ts
Exit code: 1
Error: Cannot find module './post-policy'
```

GREEN:

```text
pnpm vitest run src/utils/post-policy.test.ts
Exit code: 0
1 file passed; 3 tests passed
```

### rehypeLink missing href

RED:

```text
pnpm vitest run src/plugins/rehypeLink.test.ts
Exit code: 1
TypeError: Cannot read properties of undefined (reading 'startsWith')
```

GREEN:

```text
pnpm vitest run src/plugins/rehypeLink.test.ts
Exit code: 0
1 file passed; 1 test passed
```

### Lightbox idempotent binding

RED:

```text
pnpm vitest run --environment jsdom src/scripts/lightbox.test.ts
Exit code: 1
expected "addEventListener" to be called 3 times, but got 6 times
```

GREEN:

```text
pnpm vitest run --environment jsdom src/scripts/lightbox.test.ts
Exit code: 0
1 file passed; 1 test passed
```

## Commands and results

- `pnpm add -D vitest jsdom`
  - Exit 0；安装 `vitest 4.1.10`、`jsdom 29.1.1`。
  - 安装发生在修正 `allowBuilds` 之前，因此当次命令报告 `esbuild` 构建脚本被忽略；配置随后已按计划修正。
- `pnpm vitest run src/utils/post-policy.test.ts`
  - RED exit 1；GREEN exit 0，3/3 tests passed。
- `pnpm vitest run src/plugins/rehypeLink.test.ts`
  - RED exit 1；GREEN exit 0，1/1 test passed。
- `pnpm vitest run --environment jsdom src/scripts/lightbox.test.ts`
  - RED exit 1；GREEN exit 0，1/1 test passed。
- `pnpm astro check`（策略接入后）
  - Exit 0；0 errors，既有 hints。
- `pnpm vitest run`（首次全量）
  - Exit 1；Lightbox 测试默认运行在 Node 环境，`document is not defined`。
- `pnpm vitest run`（加入文件级 jsdom 注解后）
  - Exit 0；3 files passed，5/5 tests passed。
- `pnpm astro check`（最终）
  - Exit 0；0 errors，Astro 汇总为 50 hints。
- `pnpm build`
  - Exit 0；包含 `astro check`、`astro build`、Pagefind。
  - 111 pages built；Pagefind 扫描 111 个 HTML，索引 54 pages / 8111 words。
- 构建产物检查
  - `dist/index.html` 中 Livecodes 代码先查询 `.livecodes-runner`，再执行动态 import。
  - 当前构建的 HTML 中没有 `.livecodes-runner` 内容节点，因此首页不会发起 Livecodes 模块导入。

## Test architecture adjustment

计划给 Lightbox 单测命令显式指定 `--environment jsdom`，但阶段验证要求不带参数运行 `pnpm vitest run`。默认环境是 Node，导致单测在全量运行时缺少 `document`。为兼容两种命令，在 `src/scripts/lightbox.test.ts` 添加了 Vitest 文件级 `// @vitest-environment jsdom` 注解；断言和生产实现未改变。

## Unresolved concerns

- 当前内容集没有生成包含 `.livecodes-runner` 的 HTML 页面，因此只验证了构建产物中的 DOM 守卫和首页不触发导入，未能以现有文章做 runner 页面端到端初始化验证。
- 构建仍输出任务开始前已有的 warnings/hints，包括空 `friends` collection、Astro content `z` deprecation hints、Lightbox CSS `:global` minify warning 和大 chunk warning；本阶段按范围约束未处理。
- `package.json` 与 `pnpm-lock.yaml` 在任务开始前已有未提交的 Astro 7 升级改动；本次只追加测试依赖和 lint-staged 修正，未尝试拆分或回退既有差异。

## Phase 1 review fix: compiled browser modules

### Root cause

`src/layouts/Layout.astro` 和 `src/components/Lightbox.astro` 使用 `?url` 导入 `.ts`，再由内联脚本执行动态 import。该方式将 TypeScript 当静态资源复制到 `dist/_astro`，绕过 Vite 的 TypeScript 转译。复核前的 `dist/index.html` 明确引用：

```text
/_astro/lightbox.5N2tt5Vu.ts
/_astro/livecodes.BDOIfsTo.ts
```

浏览器在 runner 存在时会直接导入原始 `livecodes.ts`；Lightbox 也会直接导入原始 `lightbox.ts`，两者都不是可安全执行的生产 JavaScript。

### Added build-output regression test

新增 `src/scripts/build-assets.test.ts`，在构建后断言：

- 首页不再引用 `/_astro/lightbox.*.ts`，且某个生成的 `.js` 资产包含 Lightbox 初始化代码。
- 首页不再引用 `/_astro/livecodes.*.ts`，且某个生成的 `.js` loader 同时包含 `.livecodes-runner` 检测与动态 import。

### RED evidence

```text
pnpm vitest run src/scripts/build-assets.test.ts
Exit code: 1
1 file failed; 2 tests failed
```

两个断言分别捕获 `dist/index.html` 中的 `/_astro/lightbox.5N2tt5Vu.ts` 与 `/_astro/livecodes.BDOIfsTo.ts`。

### Implementation

- `src/components/Lightbox.astro`
  - 移除 `lightbox.ts?url` 与内联 URL import。
  - 改为 Astro 处理的普通 `<script>`，静态导入 `@/scripts/lightbox`；Vite 负责转译、打包并保留模块的全局自动初始化。
- `src/layouts/Layout.astro`
  - 移除 `livecodes.ts?url` 与 `define:vars`。
  - 改为 Astro 处理的普通 `<script>`。
  - 继续先检测 `.livecodes-runner`，仅存在时才动态 import `@/scripts/livecodes`；`astro:page-load` 仍复用同一检测函数。

### GREEN evidence and commands

```text
pnpm build
Exit code: 0
111 pages built
Pagefind indexed 54 pages / 8111 words
```

生成产物变为 Vite 编译后的 JavaScript：

```text
/_astro/Lightbox.astro_astro_type_script_index_0_lang._BOLjt0E.js
/_astro/Layout.astro_astro_type_script_index_0_lang.BPqPSAck.js
/_astro/livecodes.Dugv7MJl.js
```

```text
pnpm vitest run src/scripts/build-assets.test.ts
Exit code: 0
1 file passed; 2 tests passed
```

```text
pnpm vitest run
Exit code: 0
4 files passed; 7 tests passed
```

IDE diagnostics for `Layout.astro`、`Lightbox.astro` 和 `build-assets.test.ts`：无 linter error。

### Review-fix concerns

- 当前内容集仍没有实际 `.livecodes-runner` 页面，因而未执行真实 runner 的浏览器端到端初始化；构建产物测试已验证 loader 是编译后的 JS，且动态导入前保留 DOM 守卫。
- 完整构建仍保留此前记录的既有 warnings/hints；本次修复没有新增构建错误或 linter error。

## Phase 1 review fix: dist-independent unit tests

### Root cause

`src/scripts/build-assets.test.ts` 被默认 `src/**/*.test.ts` 测试配置收集，但直接读取被忽略的 `dist/index.html` 和 `dist/_astro`。因此：

- 干净检出未执行 build 时，`pnpm vitest run` 会因 `ENOENT` 失败。
- 工作区已有 `dist` 时，测试可能读取陈旧产物并给出错误结论。

### RED evidence

为模拟干净检出且不移动或删除用户现有 `dist`，临时将旧测试的产物根目录改为等价的不存在目录 `dist-missing` 后执行：

```text
pnpm vitest run src/scripts/build-assets.test.ts
Exit code: 1
1 file failed; 2 tests failed
ENOENT: no such file or directory, open 'F:\ALL\Astro\blog\dist-missing\index.html'
```

这确认旧默认单测依赖预先存在的构建产物。

### Implementation

- 删除 `src/scripts/build-assets.test.ts`。
- 新增 `src/scripts/browser-modules.test.ts`，只读取版本控制内源码：
  - `Lightbox.astro` 不允许出现 `?url`，并要求通过 Astro 处理的普通 `<script>` 导入 `@/scripts/lightbox`。
  - `Layout.astro` 不允许出现 `?url`，并要求 `.livecodes-runner` DOM 守卫位于 `import('@/scripts/livecodes')` 之前。
- 新增独立构建后检查 `scripts/check-browser-assets.mjs`。
- 新增命令 `pnpm check:build-assets`；该命令明确要求先完成 `pnpm build`，不由默认 Vitest 收集。

### GREEN evidence and commands

```text
pnpm vitest run src/scripts/browser-modules.test.ts
Exit code: 0
1 file passed; 2 tests passed
```

```text
pnpm vitest run
Exit code: 0
4 files passed; 7 tests passed
```

默认单测现在只依赖源码与 jsdom，不再读取 `dist`。

```text
pnpm build
Exit code: 0
111 pages built
Pagefind indexed 54 pages / 8111 words
```

```text
pnpm check:build-assets
Exit code: 0
Browser assets: compiled JavaScript verified.
```

`browser-modules.test.ts`、`check-browser-assets.mjs` 与 `package.json` 的 IDE diagnostics：无 linter error。

### Review-fix concerns

- `pnpm check:build-assets` 是构建后检查，单独在没有 `dist` 的干净检出上运行会按设计失败；标准顺序是先 `pnpm build`，再运行该命令。
- 完整构建仍保留此前记录的既有 warnings/hints；本次修复没有新增 warning、构建错误或单测依赖。
