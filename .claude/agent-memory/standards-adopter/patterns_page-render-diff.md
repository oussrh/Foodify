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
