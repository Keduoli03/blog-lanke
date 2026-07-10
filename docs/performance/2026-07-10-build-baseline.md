# Phase 2 Build Baseline

Measured on Windows from `optimize/project-performance` with `pnpm build` (Astro check, Astro build, then Pagefind).

## Results

| Metric                 | Before phase 2 | After phase 2 |            Change |
| ---------------------- | -------------: | ------------: | ----------------: |
| End-to-end build       |       45.632 s |      44.129 s | -1.503 s (-3.29%) |
| Astro page build       |        12.57 s |       11.86 s |  -0.71 s (-5.65%) |
| Generated pages        |            111 |           111 |                 0 |
| `dist` files           |            333 |           333 |                 0 |
| `dist` bytes           |     11,353,852 |    11,353,834 |               -18 |
| Pagefind indexed pages |             54 |            54 |                 0 |
| Pagefind indexed words |          8,111 |         8,111 |                 0 |

These are single local cold-command samples, not a statistically significant benchmark. The content corpus and the pre-existing working-tree changes were kept in place for both measurements.

## Notes

- Pagefind still scans 111 HTML files and indexes 54 pages.
- The current production-visible content set contains no public column post. Of 22 column files, 2 use legacy `status: false` (transformed to `draft: true`), 16 explicitly use `draft: true`, and the remaining 4 use `draft: false` with `unlisted: true`; 19 files are unlisted in total, overlapping the draft groups. Consequently, this build has neither a column detail artifact nor its legacy static HTML redirect artifact; route behavior is covered by pure/source regression tests until a column is made public.
- Math syntax is present in `src/content/posts/Blog常用书写格式记录.md`, so `remarkMath`, `rehypeKatex`, and the Markdown layout KaTeX stylesheet remain enabled.

## Phase 3 Runtime Sample

Measured from the final production build through `astro preview` on the same Windows checkout. Browser values are one Chromium cold navigation sample and are not statistically significant.

| Metric                         |     Phase 3 result | Phase 2 comparison |
| ------------------------------ | -----------------: | -----------------: |
| Emitted JavaScript files       |                 50 |       Not recorded |
| Emitted JavaScript bytes       |            805,054 |       Not recorded |
| Largest JavaScript chunk       | 190,338 (`Waline`) |       Not recorded |
| Header shell chunk             |             18,428 |       Not recorded |
| Homepage requests              |                 43 |       Not recorded |
| Homepage script requests       |                 38 |       Not recorded |
| Homepage script transfer bytes |            186,632 |       Not recorded |
| Homepage script decoded bytes  |            506,458 |       Not recorded |
| `dist` files                   |                328 |                 -5 |
| `dist` bytes                   |         10,750,853 |  -602,981 (-5.31%) |

The phase 2 run did not preserve a client-JavaScript/request baseline, so this document does not invent a before/after percentage for those metrics. The phase 3 build contains no `registerRi` artifact; the Header chunk imports explicit icon-data modules and the generated homepage includes complete Header navigation HTML before hydration.
