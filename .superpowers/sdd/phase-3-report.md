# Phase 3 Runtime Optimization Report

Date: 2026-07-10  
Branch: `optimize/project-performance`  
Commit created: no

## Status

Phase 3 is implemented and verified. Phase 1/2 behavior, static routes, content-index/stat caches, Lightbox, and Livecodes changes were preserved. No article content was edited for this phase.

## Implemented work

### Header SSR and hydration

- Replaced the separate `Provider client:only="react"` and `Header client:load` roots in both layouts with one `HeaderShell client:load` root. Provider effects therefore cannot mutate shared Jotai state before a different React root hydrates Header.
- Wrapped that shell in `MotionConfig reducedMotion="user"`.
- Made `RootPortal` mount portals only after the shared root hydrates, preserving identical server/first-client trees.
- Made the theme atom SSR-safe and deferred reading browser storage until `ThemeProvider` mounts; the first review build exposed and then verified this boundary.
- Added a real jsdom `renderToString` + `hydrateRoot` regression that exercises the mobile viewport update and asserts no hydration-related `console.error`.
- Updated the Swup morph selector from the obsolete `Provider` export to `HeaderShell`, so incoming route metadata props update the same combined island.
- Generated homepage HTML contains the avatar, primary navigation text, search button, and social-links trigger before hydration.
- Provider and Header now form one SSR + hydration island; Header subcomponents remain in that root so shared state, keyboard search, modal presentation, and Swup synchronization stay intact.

### Remix Icon data

- Removed `src/icons/registerRi.ts` and every component import of it.
- Added `scripts/generate-ri-icons.mjs`, with repository paths derived from `import.meta.url` rather than the caller's working directory.
- The generator now scans named `@/icons/ri` imports in source `.ts`, `.tsx`, and `.astro` files and rejects both missing and unused explicit exports. `generate:icons` writes data; `check:icons` verifies source usage and byte-for-byte generated output.
- `src/icons/ri.ts` now contains explicit current-version icon data; it neither calls `addCollection` nor imports the complete collection at runtime.
- Updated Header, archive filter, social lists, theme switch, toast close button, and back-to-top controls to pass icon data.
- Corrected `HeaderDrawer`'s `icon-flask` mapping to `riFlaskLine`.
- Final build has zero `registerRi` artifacts. The Header shell chunk embeds/imports only explicit icon data.

### Scroll and TOC

- Replaced lodash throttling in `PageScrollInfoProvider` with one pending `requestAnimationFrame`.
- Scroll listener is passive; pending frames are canceled during cleanup.
- Replaced PostToc’s per-scroll heading layout reads with `IntersectionObserver` using `rootMargin: -80px 0px -70% 0px`.
- The callback maintains a persistent visible-heading set, applies every entry in a batch, then resolves the active item from document heading order. Regression coverage includes unordered entries, multiple visible headings, exits, and reverse scrolling.
- Observer disconnects on cleanup.
- Non-active TOC links remain visibly readable, gain focus-visible opacity, and active links expose `aria-current="location"`.

### Static display islands

- Replaced `RunningDays.tsx` with server-rendered `RunningDays.astro`.
- Replaced per-card `RelativeDate client:idle` islands with stable absolute `<time datetime>` output.
- Deleted the obsolete React display components.

### Toast and Modal loading

- Removed ToastContainer from the global base Layout.
- Mounted ToastContainer with `client:idle` only inside the Markdown `main` Swup container. This placement is required so entering an article through Swup inserts and hydrates the toast host.
- Verified an article entered through Swup can hydrate the visible copyright island and show `已复制文章链接`.
- Kept ModalStack global because the search modal trigger is in the global Header on every page. It now uses `client:idle`; removing it or restricting it by route would break keyboard/header search. This is the minimum safe implementation.

### Header animation path and reduced motion

- Removed Framer Motion from `AnimatedLogo` and `HeaderMeta`.
- Removed Framer Motion from the simple primary-menu fade and active-icon transition.
- Kept logo, primary menu, and metadata wrappers mounted and restored equivalent opacity / 20px metadata transitions with state classes, `aria-hidden`, and `inert`.
- Added `MotionConfig reducedMotion="user"` for retained Header motion, plus a real media-query preference test.
- Added `motion-reduce` transition/transform/backdrop fallbacks and disabled the search spinner's CSS animation under reduced motion.
- Retained Framer Motion for drawer/presence, portal dropdowns, HeadGradient, and modal interactions where behavior is not a simple CSS transition.

### Browser module correction

- Converted the inline bare `import 'iconify-icon'` into an Astro-processed module script. The previous production HTML produced an unresolved bare-module browser error.

## Files changed for phase 3

- Dependencies/config: `package.json`, `pnpm-lock.yaml`, `vitest.config.ts`, `astro.config.js`
- Layout/runtime boundaries: `src/layouts/Layout.astro`, `src/layouts/PageLayout.astro`, `src/layouts/MarkdownLayout.astro`, `src/components/RootPortal.tsx`
- Header: `src/components/header/HeaderShell.tsx`, `AnimatedLogo.tsx`, `BluredBackground.tsx`, `Header.tsx`, `HeaderContent.tsx`, `HeaderMeta.tsx`, `HeaderDrawer.tsx`, `SearchButton.tsx`, `SocialLinks.tsx`
- Icons: `src/icons/ri.ts`, deleted `src/icons/registerRi.ts`, `scripts/generate-ri-icons.mjs`
- Provider/scroll/TOC: `src/components/provider/ThemeProvider.tsx`, `src/store/theme.ts`, `src/components/provider/PageScrollInfoProvider.tsx`, `src/components/post/PostToc.tsx`
- Static displays: `src/components/footer/Footer.astro`, `RunningDays.astro`, deleted `RunningDays.tsx`, `src/components/post/PostMetaInfo.astro`, deleted `RelativeDate.tsx`
- Conditional UI/icon consumers: `src/components/ToastContainer.tsx`, `ArchiveFilter.tsx`, `BackToTopFAB.tsx`, `footer/ThemeSwitch.tsx`, `hero/SocialList.tsx`
- Tests: `src/layouts/phase-3-runtime.test.ts`, `src/components/header/Header.test.tsx`, `HeaderHydration.test.tsx`, `HeaderSsr.test.ts`, `src/components/provider/PageScrollInfoProvider.test.tsx`, `src/components/post/PostToc.test.tsx`, `src/icons/ri-generator.test.ts`, `src/store/theme.test.ts`, updated `src/scripts/browser-modules.test.ts`
- Metrics: `docs/performance/2026-07-10-build-baseline.md`

## RED / GREEN record

RED:

- Initial phase source suite: 5 expected failures for client-only Header, full RI registration, React date islands, global Toast/client-only Modal, and simple Header Framer Motion.
- Scroll/TOC component suite: 2 expected failures because no rAF scheduling and no heading observation occurred.
- Header SSR regression: failed with `ReferenceError: document is not defined` at `RootPortal`.
- Browser-module regression: failed because Layout contained an inline bare `iconify-icon` import.
- Swup Toast boundary regression: failed because ToastContainer was outside the replaced `main`.
- Review regression run: 5 files failed. It demonstrated the missing combined shell, absent persistent transition wrappers, TOC's incorrect unordered-entry selection, cwd-dependent icon generation, absent icon scripts, and wrong drawer flask mapping.
- The first post-review production build failed with `ReferenceError: localStorage is not defined` after Provider entered the SSR graph. A focused SSR import test reproduced this before the theme atom/provider fix.
- A final Swup source regression failed because `astro.config.js` still morphed `[component-export="Provider"]`; it passed after changing the target to `HeaderShell`.

GREEN:

- Final `pnpm vitest run`: 18 files, 38 tests passed.
- Real Header hydration, reduced-motion propagation, persistent CSS transitions, rAF/passive cleanup, ordered visible-heading observation, icon generation/checking, SSR theme import, source boundaries, browser module compilation, and prior phase regressions all pass.

## Verification

- `pnpm vitest run`: PASS (18 files, 38 tests).
- `pnpm astro check`: PASS (0 errors; 50 existing hints).
- `pnpm build`: PASS after the SSR theme correction; 111 pages, Astro build 34.77 s, Pagefind indexed 54 pages / 8,111 words.
- `pnpm check:build-assets`: PASS.
- `pnpm check:icons`: PASS, including a test invoked from an unrelated temporary cwd.
- Homepage generated HTML: Header/navigation SSR confirmed; Header hydrates successfully.
- Generated assets: no `registerRi` chunk; combined Header shell chunk is 18,428 bytes.
- Post-review production preview smoke: `/archives` had one fixed Header and a hydrated `HeaderShell` island; Swup navigation to `/posts/obsidian-hermes-memory` produced the expected title/H1, retained one fixed Header, and captured no runtime/hydration `console.error`.
- Article copy toast was verified after Swup entry.
- No failed local resource was present in the final homepage cold sample.

## Runtime/build sample

- Emitted JS: 50 files, 805,054 bytes.
- Largest JS chunk: `Waline`, 190,338 bytes.
- Combined Header shell chunk: 18,428 bytes.
- Homepage cold sample: 43 total requests; 38 script requests; 186,632 script transfer bytes; 506,458 decoded script bytes.
- `dist`: 328 files, 10,750,853 bytes; versus phase 2: -5 files and -602,981 bytes (-5.31%).
- Phase 2 did not record client JS/request metrics, so no unsupported percentage comparison was made.

## Incomplete items and concerns

- No public column detail page exists in this content set, so a real `/columns/{column}/{post}` browser traversal could not be performed. The columns index and existing phase-2 route tests/build checks passed.
- ModalStack remains a global idle island because Header search is global. A true first-use dynamic modal host would require changing the existing modal API/store lifecycle and was judged too risky for this phase.
- Header and Provider are intentionally one SSR + `client:load` island. A finer sub-island split was not attempted because it would alter shared state and modal behavior without reliable validation.
- `ArchiveFilter` visual classes and chip/section layout predated this phase's icon patch. The recorded phase patch changed only icon imports, icon prop typing, and icon values, so those uncommitted visual edits were treated as user work and not reverted.
- Build output retains pre-existing Astro/Zod deprecation hints and Lightbox `:global` minifier warnings; this phase did not modify those unrelated warnings.
- Browser numbers are a single local Chromium/preview sample, not a statistically significant benchmark.

## Header active-icon animation regression fix

- Restored only the conditionally mounted active menu icon wrapper to `motion.span` with `initial={{ y: 10, opacity: 0 }}` and `animate={{ y: 0, opacity: 1 }}`.
- Preserved explicit on-demand Remix Icon data, the shared `HeaderShell`, `MotionConfig reducedMotion="user"`, and all other phase 3 performance changes.
- Narrowed the phase boundary regression so it continues to protect the persistent logo, metadata, and primary-menu CSS transitions without incorrectly prohibiting the active icon's enter animation.

RED:

- `pnpm vitest run src/components/header/Header.test.tsx`: 1 expected failure, 2 passed. The new source-structure regression could not find the active icon's `motion.span` y/opacity enter semantics.

GREEN:

- Focused Header regression: 1 file, 3 tests passed.
- Full `pnpm vitest run`: 19 files, 40 tests passed.
- `pnpm astro check`: 0 errors, 0 warnings, 50 existing hints.

## Final review follow-up

Date: 2026-07-10  
Status: `DONE_WITH_CONCERNS`  
Commit created: no  
Article content edited: no

### Corrections

- PostToc now keeps each observed heading's latest `boundingClientRect.top` and selects the last heading in document order that has crossed the 80px reading threshold. This keeps long sections active when no heading intersects, supports reverse scrolling and clears before the first heading, without restoring per-scroll full-layout reads.
- LiveCodes now uses a temporary `data-lc-initializing` marker. `data-lc-init` is written only after `createPlayground()` resolves; failures are caught and logged, the temporary marker is cleared, and a later `astro:page-load` invocation can retry without an unhandled rejection.
- `src/pages/columns/[column].astro` now consumes the cached `getPublicPosts()` result instead of calling `getCollection('posts')` again, preserving the shared draft/unlisted policy.

### RED / GREEN evidence

- PostToc RED: focused suite failed because all non-intersecting entries cleared `aria-current`, even though the first heading's latest top was 40px and the second remained below at 900px.
- PostToc GREEN: 1 file / 2 tests passed, covering unordered entries, long sections with no intersections, reverse scrolling, and the region before the first heading.
- LiveCodes RED: focused suite showed `initLivecodes()` returned `undefined`, retained the permanent init marker, and Vitest captured the rejected `createPlayground()` Promise as an unhandled rejection.
- LiveCodes GREEN: 1 file / 1 test passed; the first initialization rejects cleanly and the same runner succeeds on the next invocation.
- Column cache RED: route regression failed because the listing still imported and called `getCollection('posts')`.
- Column cache GREEN: 1 file / 4 tests passed with `getPublicPosts()` and no direct posts collection call in the listing route.

### Final verification

- `pnpm vitest run`: PASS, 20 files / 43 tests.
- `pnpm astro check`: PASS, 0 errors / 0 warnings / 50 existing hints.
- `pnpm build`: PASS, 111 pages; Pagefind indexed 54 pages / 8,111 words.
- `pnpm check:build-assets`: PASS.
- `pnpm check:icons`: PASS.
- IDE diagnostics for the touched source and test files: no errors.

### Remaining limitation

- The content set still has no public column article, so a real generated old-route redirect and public column detail artifact cannot be exercised without changing article frontmatter. The existing pure `getPostRouteProps()` behavior tests and canonical/meta-refresh source regression remain the proportionate coverage; no complex Astro template harness was added.

## Final review correction: observer and LiveCodes lifecycle

Date: 2026-07-10  
Status: `DONE_WITH_CONCERNS`  
Commit created: no  
Article content edited: no

This section supersedes the PostToc top-threshold algorithm and LiveCodes array lifecycle described in the preceding follow-up.

### Corrections

- PostToc now maintains the current intersecting heading set. After each observer batch it selects the first intersecting heading in document order; when the set becomes empty it preserves the current active heading through long sections. An initial all-non-intersecting batch leaves the TOC empty.
- Reverse scrolling is driven directly by the real observer transition: when the previous heading re-enters from the top with `isIntersecting: true`, it immediately becomes active. Selection no longer depends on `boundingClientRect.top <= 80`.
- LiveCodes now stores instances in a runner-element map. Repeated initialization preserves connected runners and neither destroys nor recreates them. Each call destroys only instances whose runner has left the DOM, removes their markers, initializes only new runners, and retains the existing failure-marker cleanup and retry behavior.

### RED / GREEN evidence

- PostToc RED: the realistic observer test produced 2 expected failures because intersecting headings at tops 120/180 were ignored by the previous 80px comparison.
- PostToc GREEN: focused suite passed, 1 file / 2 tests. It covers initial empty state, unordered intersections, downward transitions, an empty long-section interval, and immediate reverse-scroll activation on `isIntersecting: true`.
- LiveCodes RED: focused suite failed because a second `initLivecodes()` call invoked `destroy()` once on a still-connected successful instance.
- LiveCodes GREEN: focused suite passed, 1 file / 2 tests. It covers failure/retry and connected-instance idempotency.

### Verification

- `pnpm vitest run`: PASS, 20 files / 44 tests.
- `pnpm astro check`: PASS, 0 errors / 0 warnings / 50 existing hints.
- `pnpm build`: PASS, 111 pages; Pagefind indexed 54 pages / 8,111 words.
- `pnpm check:build-assets`: PASS.
- `pnpm check:icons`: PASS.
- Prettier and IDE diagnostics for the corrected source/test files: PASS.

### Remaining limitation

- The content set still has no public column article; the previously documented static redirect artifact limitation remains unchanged.

## User-approved TOC architecture change: cached offsets

Date: 2026-07-10  
Status: `DONE_WITH_CONCERNS`  
Commit created: no  
Article content edited: no

This user-approved change supersedes every earlier PostToc IntersectionObserver implementation and test description in this report.

### Implementation

- On mount, PostToc schedules one animation frame, queries the current article headings, reads each document offset once as `getBoundingClientRect().top + scrollY`, sorts the cache by offset, and resolves the initial active item.
- The passive scroll listener only schedules one pending rAF. A normal scroll frame reads `scrollY` once, performs no heading layout reads, and binary-searches the last cached `offset <= scrollY + 80`.
- The result is empty before the first heading, advances immediately in either direction at heading boundaries, and remains stable throughout long sections.
- Resize, `astro:page-load`, and `swup:contentReplaced` mark the next frame for a fresh heading query and offset measurement. This also re-queries replaced article DOM rather than retaining stale elements.
- Cleanup removes every listener and cancels a pending frame.
- PostToc no longer imports Jotai scroll atoms or depends on `PageScrollInfoProvider`; TOC-list auto-scrolling now aligns based on the item's own container bounds.

### RED / GREEN evidence

- The old IO tests were removed and replaced with real document-offset fixtures.
- RED: focused run failed 4/4 behavior tests. After adding a no-op legacy observer only to avoid an environment error, failures showed no active transition from offsets, zero scroll rAF scheduling, no remeasurement behavior, and no cleanup cancellation.
- GREEN: focused run passed 1 file / 4 tests. Coverage includes initial-before-first, downward crossing, long-section retention, immediate upward crossing, one rAF for multiple same-frame scroll events, no per-scroll heading layout reads, resize/Astro/Swup remeasurement including replaced DOM, and cleanup.
- An initial parallel verification run hit only the default 5-second test timeout under CPU contention; the same focused and full suites were rerun serially and passed normally.

### Verification

- Focused PostToc suite: PASS, 1 file / 4 tests.
- `pnpm vitest run`: PASS, 20 files / 46 tests.
- `pnpm astro check`: PASS, 0 errors / 0 warnings / 50 existing hints.
- `pnpm build`: PASS, 111 pages; Pagefind indexed 54 pages / 8,111 words.
- `pnpm check:build-assets`: PASS.
- `pnpm check:icons`: PASS.

### Remaining limitation

- The content set still has no public column article; the previously documented static redirect artifact limitation remains unchanged.

## BackToTopFAB icon centering regression

- Added a source regression requiring both circular action buttons—the comments button and Back to top button—to use `flex items-center justify-center`.
- RED: the focused test failed because both button class lists lacked the three centering utilities.
- GREEN: both buttons now share the centering utilities; their size, visual classes, Framer Motion behavior, and explicit on-demand Iconify data are unchanged.
- Verification: focused Vitest passed (1 file / 1 test), full Vitest passed (21 files / 47 tests), and `pnpm astro check` passed (0 errors / 0 warnings / 50 existing hints).
- Commit created: no.
