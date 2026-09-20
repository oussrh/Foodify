---
name: patterns-page-render-diff
description: A test shape that proves a Next server-page split kept the DOM - render HEAD and working-tree versions of the async page with mocked prisma/auth to static markup and compare strings
metadata:
  type: project
---

To prove a page split kept its DOM: copy the HEAD page with `git show HEAD:<path> >
test-results/render-check/old/<name>.tsx` (gitignored dir, `@/` imports still resolve), then a
vitest file that mocks `@/lib/prisma`, `@/auth`, `@/lib/auth-guard`, `next/navigation`
(`redirect` throws) and every `'use client'` child as `(props) => <div data-stub=... data-props={JSON of props with keys sorted} />`,
calls `await Page(props)` (an async server component returns a plain element tree) and
`renderToStaticMarkup`s both, `expect(after).toBe(before)`. `next/link`, lucide and the ui/
primitives render fine under node. Cover every branch the page has (null row, empty lists,
verified/unverified) as separate calls. Mutation-test the harness once (flip one class, see red).

**Why:** Used on 2026-09-20 for seven pages of phase 7 (T4): it caught nothing in the end, but
it turned "I copied the JSX carefully" into a string equality, and the prop stubs also proved
the extracted `restaurantFormValues`/`dishFormValues` mappings feed the forms the same values.

**How to apply:** Any refactor of a page or a server component whose output is markup. Delete
`test-results/render-check/` afterwards; it compares HEAD with the tree and means nothing once
committed. Cut JSX out of the original by exact line range with a script (dedent by at most the
line's own indent - the codebase has 1-space lines inside template literals) instead of retyping.

## Addendum (phase 8, 2026-09-20): 43 scenarios over 10 pages from the scratchpad

- Run it from `<scratchpad>/<territory>/proof` with the node_modules junction and `--root` (see
  [[patterns-render-diff-proof]]); `git show HEAD:<page>` copies keep their `@/` imports, and a
  HEAD page whose component you also change gets a HEAD copy of that component beside it with
  the import rewritten to `./`.
- A `vi.mock` factory cannot touch a top-level `const`, not even an arrow that only does
  `await import('./stubs')`: wrap it in `vi.hoisted(() => async () => (await import('./stubs')).stub)`.
  Stub every `'use client'` child as `<div data-stub data-props={sorted JSON}>` with element
  props rendered as `data-slot` children; a page that passes rows to a client list is proven
  by that JSON (Dates land as ISO strings, Decimal money as its string).
- `redirect`/`notFound` mocked to throw; `render()` returns `THREW <message>` so a guard
  scenario compares the throw. Read the size table afterwards: only guard scenarios may throw.
- A dead `${cond ? '' : ''}` inside a class template literal leaves one trailing space in the
  attribute; dropping it is a 1-byte diff the harness normalises explicitly (assert the needle
  occurs once) and the report names.
- `abatty ratchet` with the per-file debt reads a NEW over-budget file as `1 / 8 REGRESSED`
  even while the floor is unlocked: the red half of the mutation test needs no baseline lock.
