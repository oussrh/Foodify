---
title: "Standards progress"
description: "The scoreboard of the engineering standard on this repository: what each metric measures, the ratchet that holds it, the phases open, and the dated log of every deliberate change of a floor. Numbers only, never 'improved'."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["standards", "ratchet", "scoreboard"]
related: ["./README.md", "./ADOPTION_DECISIONS.md"]
---

# Standards progress

## Scoreboard

| Metric | Day 0 | Now | Target | Held by | Rule |
|---|---|---|---|---|---|

## Phase status

| # | Phase | Status |
|---|---|---|

## Log

- 2026-09-20 · `size.overBudget` 31 → 34, `size.excessCode` 5302 → 5307 · owner: Oussama Rhoni. Reason: the harness merged into `main`, whose branding, contact and PWA work (four files: `components/menu/restaurant-page.tsx`, `app/restaurant/[slug]/page.tsx`, `components/branding/branding-panel.tsx`, `components/contact/contact-panel.tsx`) the day-0 floor was never measured on; the floor is re-measured on the tree it now guards. Same commit: `valid.rawEnv` held at 37 (`lib/env.ts` created), `docs.indexDrift` 1 → 0 and promoted to hard.
