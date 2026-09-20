---
title: "Lessons"
description: "What we learned the hard way, one entry per lesson, newest first; every line added to CLAUDE.md traces back to an entry here."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["lessons", "context"]
related: ["./README.md", "../CLAUDE.md"]
---

# Lessons

What we learned the hard way, one entry per lesson, newest first. A line added to `CLAUDE.md`
should trace back to an entry here (the ratchet checks that a push which grows the context file
also touches this catalogue).

## 2026-09-20 · A CRLF checkout silently blinds a probe

abatty's front-matter parser (the ratchet's probes library, inside the package) finds the closing fence with `indexOf("
---")` and splits the body on `/?
/`, so on a CRLF file the last key keeps its `` and its value never parses. `docs/TESTING.md` ends its front matter with `last_verified`; under `core.autocrlf=true` the merge checkout rewrote the file as CRLF, the doc dropped out of `docs.behindCode`, and the hard metric went "SCANNED ZERO" on `main` minutes after the branch was green. The lesson is the plan's own warning about CRLF-blind regexes, met in the tool rather than in our code: `.gitattributes` now pins LF in every checkout (`* text=auto eol=lf`), and the parser bug is an upstream report. When a hard metric scans zero, suspect the probe's input before the floor.

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
