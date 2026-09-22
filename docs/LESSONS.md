---
title: "Lessons"
description: "What we learned the hard way, one entry per lesson, newest first; every line added to CLAUDE.md traces back to an entry here."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["lessons", "context"]
related: ["./README.md", "../CLAUDE.md"]
source_truth: ["CLAUDE.md", ".claude/rules/size-limits.md"]
last_verified: "2026-09-22"
---

# Lessons

What we learned the hard way, one entry per lesson, newest first. A line added to `CLAUDE.md`
should trace back to an entry here (the ratchet checks that a push which grows the context file
also touches this catalogue).

## 2026-09-22 · A test that reads the code's own list proves only that the list agrees with itself

`lib/roles.ts` was written after a waiter account could be given a second factor and lock itself
out for good: the guard named `KITCHEN` instead of asking what made that role a device. The
module states the fact once, in `DEVICE_ROLES`, and every guard reads it. It shipped with no test.

The obvious test is the wrong one. Walking `UserRole` and asserting that `isDeviceAccount(role)`
matches `DEVICE_ROLES.includes(role)` is green whatever the list contains — including the list
that caused the original lockout. It restates the implementation in the assertion, so the
implementation can never fail it. The load-bearing version names the four roles one at a time,
in the test, as a second statement of the truth that does not come from the code. Both are kept:
dropping WAITER from `DEVICE_ROLES` reddens the literal assertions and leaves the consistency
one green, which is the whole distinction, checked rather than assumed.

The general shape: an oracle that shares the code's source of truth is not an oracle. When a test
imports the constant, the map, the schema or the fixture that the code under test derives its
answer from, ask what it would take for that test to fail. If the answer is "a typo", it is
testing the compiler. Say the expected value independently — literally, or from a second source
such as a fixture file or the specification — and keep the consistency check beside it if it
earns its place, rather than in place of it.

## 2026-09-22 · A contract in a comment is not a contract

`DishPhoto` renders `next/image` with `fill` and left the positioning to its callers — a comment
said "both pass their own sizing on the wrapper". Three of the four callers wrote `relative`. The
fourth, the cart line, did not, so the photo positioned against the sheet instead of against its
48px box and covered the order: the heading, the lines, the subtotal and the form were all still
there, black on white, behind a stretched image. Nothing threw, nothing was missing from the DOM,
and every value read back correct — which is why it was read as an empty sheet and looked for in
the data for weeks. Next had been warning about it in the console on every render the whole time.

Two things to take from it. A component that needs something of its parent should provide it
itself rather than document it; the comment cost more than the `<span className="relative">`
would have. And when a page renders blank but the accessibility tree is complete, stop looking at
the data: hit-test the element that should be visible (`document.elementFromPoint`) and see what
is actually on top of it.

## 2026-09-22 · A password is the account, not one restaurant's key

Letting a restaurant run its own People tab meant letting a manager set a colleague's password.
Within one restaurant that is fine — managers there are already peers with full control of the
menu, the dishes and the settings. But an account is not scoped to a restaurant: a manager who
also runs a second one carries that access inside the same password, so resetting it from the
first restaurant hands over the second. The guard is therefore not "may I manage this
restaurant" but "does this account reach further than the restaurant we share": a reset is
refused when the target manages more than one, and left to a super admin. Removal needed no such
limit, because it detaches one restaurant and touches nothing else.

The same reading says why the control it replaced could only ever have been a super admin's: it
offered a checkbox list of every manager on the platform, so using it at all meant reading other
clients' people. Typing the address does the same job and shows nothing. When a permission feels
like it belongs to a tenant, check what the object it acts on can reach outside that tenant —
the answer is usually the boundary, not the caller's role.

## 2026-09-22 · Name the property, not the member

`setMfaEnabled` refused a second factor to `KITCHEN`. A waiter account, added later, was not
`KITCHEN`, so it could turn one on — and would then have been locked out for good, because the
code is mailed and a device's address is on `staff.invalid`, which can never be routed. The guard
had been written against the role in front of it rather than against what made that role
different: it has no mailbox. It now reads `isDeviceAccount()`, defined once beside the roles, so
the next device role is covered the day it is added rather than the day someone remembers this
call site. The same reading found the manager layout sending an unknown role to the front page
because it enumerated two of the four; it now reads `ROLE_HOME`, which is total by its type.
A condition that lists members is a condition that goes stale as the set grows: ask what the
members have in common, put that somewhere the set lives, and let the type make it exhaustive.

## 2026-09-22 · A value derived at the wrong moment is a bug types cannot see

The guest's cart shipped two faults with one root. The per-dish note was trimmed on every
keystroke, so the space the guest had just typed was swallowed and the next letter landed against
the last word ("No onions" typed as "Noonions"); trimming belongs where the value leaves (the
send, and the zod parse), not where it is stored. The menu row's `+` counted from
`quantityOf(cart)` as the render had it, so two taps in one frame both computed the same next
quantity and the second was lost; it now counts from the stored cart. Neither was visible to
TypeScript, ESLint or the unit tests — both passed every gate and only appeared under real typing
and real tapping in a browser. A derived value has a moment as well as a formula: ask which
snapshot it is reading, and whether anything can happen between that read and its use. The same
question is why `useClientValue` exists here rather than a setState in an effect.

## 2026-09-21 · A library's default is a fact to read, not to assume

The logger's first header said pino's default destination writes synchronously, and built the
"safe on a frozen serverless instance" reasoning on it; the default is an asynchronous write that
only the process's exit flushes, which a frozen or killed instance never reaches. A comment that
asserts a protection nobody verified is the missing protection. The destination is now
`sync: true` (`server/log.ts`), and a claim about a dependency's behaviour is read in its source
or its docs before it is written down (the same standard the JSDoc pass held for our own code).

## 2026-09-21 · A rule copied from a template holds the template's layout, not yours

The import-graph step was green for twelve phases while two of its boundary rules named `src/features` and
`src/components`, directories this repository does not have: a rule that matches nothing passes
forever and reads as "held". Every boundary arrow is now written for this tree (`CLAUDE.md`,
"Boundary map") and was proven red on a planted import before it was trusted; the same applies to
any instrument copied in: a check is only real once its red has been seen on this repository.

## 2026-09-20 · A CRLF checkout silently blinds a probe

abatty's front-matter parser (the ratchet's probes library, inside the package) finds the closing fence with `indexOf("\n---")` and splits the body on `/\r?\n/`, so on a CRLF file the last key keeps its `\r` and its value never parses. `docs/TESTING.md` ends its front matter with `last_verified`; under `core.autocrlf=true` the merge checkout rewrote the file as CRLF, the doc dropped out of `docs.behindCode`, and the hard metric went "SCANNED ZERO" on `main` minutes after the branch was green. The lesson is the plan's own warning about CRLF-blind regexes, met in the tool rather than in our code: `.gitattributes` now pins LF in every checkout (`* text=auto eol=lf`), and the parser bug is an upstream report. When a hard metric scans zero, suspect the probe's input before the floor.

## 2026-09-20 · Server actions are public endpoints

Every export of a `'use server'` file is reachable by an anonymous `POST` with the action id —
the page-level `auth()` checks in layouts do not protect it. For two months `createAdmin`,
`deleteRestaurant` and `resetAdminPassword` were callable without a session, and `GET /api/users`
returned password hashes. The rule that came out of it: the first statement of every action is a
guard from `lib/auth-guard.ts`, and unused exports are deleted rather than kept.

## 2026-09-20 · Design tokens belong in the context file

Sessions kept reintroducing Tailwind colour utilities and gradients after the "Quiet Plate"
rebuild because the design system lived only in `globals.css`. Writing the token names, the
radius hierarchy and the brand-colour rule into `CLAUDE.md` stopped the drift.

## 2026-09-21 · A page is a composition root; its sections live under components/<portal>/

Phases 7 and 8 split 52 files into some 150: every function under the shape rules, no file over
its budget, behaviour proven identical by rendering old and new to static markup. What kept the
splits honest was the seam rule, not the line count: a page keeps its data reads, its guard and
its redirects and hands its markup to `components/admin/` or `components/manager/`; a form
keeps its schema and submit and hands its sections to a folder of its own; a hook is a seam only
where two components share it. The two directories the pages grew are named in `CLAUDE.md` so
the next session puts a section where the last one did, and the size floors are hard at zero so
a new file over its budget fails the gate rather than a review.

