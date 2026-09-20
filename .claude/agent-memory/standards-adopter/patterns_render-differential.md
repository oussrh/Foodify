---
name: patterns-render-differential
description: Recipe that proved ten component splits behaviour-identical - HEAD copies via git archive under test-results/, SSR both to static markup with pass-through sheet/dialog mocks, plus a string-literal multiset diff; and the traps it hit
metadata:
  type: project
---

For a refactor of `.tsx` files, the proof that convinced: (1) a multiset diff of every string
literal and every `<tag`/`attr=` token between `git show HEAD:<path>` and the replacement file
set (only new component names, their props and moved import specifiers may differ), and (2) a
vitest file under `test-results/render-check-<territory>/` (git-ignored) that `git archive HEAD
<paths> | tar -x -C .../old` the originals and renders old vs new with `renderToStaticMarkup`
under the same mocks, several prop states each, `expect(after).toBe(before)`.

**Why:** used on 2026-09-20 (phase 7, T1); it caught nothing wrong but a class mutation turned
it red, so it is a real instrument. The orchestrator's own harness for pages lives in
`test-results/render-check/pages.test.tsx` and uses the same shape.

**How to apply:**
- Mock `@/components/ui/sheet` and `@/components/ui/dialog` with pass-through elements so the
  content they only show when open is compared too; mock `next/image` to an `img`,
  `next/navigation` (`usePathname`, `useRouter`), `next-auth/react`, and every `app/actions/*`
  module the component imports (server actions pull prisma).
- In the HEAD copy, rewrite `@/components/...` imports that point at an export you moved to a
  relative path into the copy (e.g. `'@/components/menu/menu-footer'` -> `'../menu/menu-footer'`).
- JSX component variables must be capitalised (`const Old = ...`), or `<o>` renders as a DOM tag.
- Effects do not run in SSR: state set in effects (fetched lists, open status) renders in its
  initial state; a list that only fills in an effect (assign-restaurants rows) is proven by the
  literal/attribute diff only. Use `test/factories/menu.ts` builders for fixtures.
- Use the locale file's real strings as needles (`MENU_TEXT.fr.arOnly`), and remember a filter in
  the URL (`?filter=ar`) legitimately removes sections from the markup.
