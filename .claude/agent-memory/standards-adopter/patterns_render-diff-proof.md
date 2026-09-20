---
name: patterns-render-diff-proof
description: How to prove a component refactor kept the DOM: SSR the HEAD copy and the working tree through vitest from the scratchpad, byte-compare, plus a token diff for branches SSR cannot reach
metadata:
  type: feedback
---

Proof of an identical refactor for a client component in this repo (no jsdom, no testing-library):
1. `git show HEAD:components/x.tsx > <scratch>/<territory>/before/components/x.tsx` (its `@/` imports
   still resolve to the project).
2. A `*.test.tsx` in `<scratch>/<territory>/render/` that `renderToStaticMarkup`s both with the same props
   in several states and writes `out/<name>.{before,after}.html` (one tag per line) before asserting.
   Run: `pnpm exec vitest run --config vitest.config.ts --dir <that folder> --coverage.enabled=false`.
3. Mocks: `vi.mock('@/app/actions/...')` works through the alias; bare packages (`next/navigation`,
   `sonner`) do NOT resolve from a test outside the root, mock them by absolute path
   (`node_modules/next/navigation.js`, `require.resolve('sonner')`).
4. Normalise only what React mints by tree position (`_R_..._` ids, `DndDescribedBy-N`, `radix-`).
5. Closed Radix dialogs, edit modes and success banners are not in SSR output: cover them with a
   token diff (TypeScript AST: string literals, template quasis, JSX text normalised the JSX way,
   attribute and element names) between the before file(s) and the after file set; every "only
   before / only after" line must be explainable (a split class, a text moved to a prop, a new
   component name). Class strings joined with `cn()` are checked with a direct render of the piece.

**Why:** the persona asks for rendered output diffed before/after; this is the setup that took an hour to
get right on 2026-09-20 (Windows `file://` ESM imports, mocks by absolute path, shared scratchpad).
**How to apply:** any phase that splits components; keep the harness in the territory's scratch folder.

## Addendum (T3, uploads/viewers, same day): reaching internal state and bare packages

- Internal state SSR never shows (uploading, drag-over, copied, controls hidden): wrap
  `React.useState` in `vi.mock('react', ...)` with a per-render map `{ [nthCall]: value }`
  for the HEAD copy; in the new version mock the extracted hooks by module
  (`vi.mock('@/components/upload/use-upload-progress')`) since their state left the component.
  Wrap `useSyncExternalStore` the same way to force "loaded". 69 scenarios over 8 files this way.
- Bare packages resolve from the scratchpad with a directory junction
  `New-Item -ItemType Junction -Path <scratch>/proof/node_modules -Target <repo>/node_modules`
  (delete the `.vite` cache dir vitest drops there first); then `--root <scratch>/proof
  --config <repo>/vitest.config.ts` and normal `vi.mock('next/image')`, `vi.mock('sonner')` work.
- Radix `DialogContent` renders nothing on the server: mock `@/components/ui/dialog` as
  pass-through divs on BOTH sides so the dialog body is compared, not skipped.
- Run a negative control before trusting IDENTICAL (a forced state must DIFFER, a one-word
  edit must DIFFER) and read the sizes per scenario to see the forcing took.
