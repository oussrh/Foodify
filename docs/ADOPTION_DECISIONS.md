---
title: "Adoption decisions"
description: "The decisions taken alone by the unattended adoption nights (/adopt-standards): date, phase, situation, the default taken, the alternative set aside, what the morning must re-read."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["standards", "adoption", "decisions"]
related: ["./README.md", "./STANDARDS_PROGRESS.md"]
---

# Adoption decisions

## 2026-09-20 · day 0 · `size.overRaw` held as a ratchet

- **Situation**: `components/ar-viewer-client.tsx` is 810 code lines, over the 800-line absolute cap, so the baseline could not be written.
- **Default taken**: `ratchet.ratchet: ["size.overRaw"]` — the metric is held at 1 and may only fall.
- **Alternative set aside**: splitting the AR viewer (support detection, model-viewer loading, controls, AR launch) in the adoption commit. It is the customer-facing AR surface, mid-redesign on `redesign/quiet-plate`; the split belongs with that work, not with the instrument.
- **Re-read when**: the redesign branch merges. The split drops the metric to 0 and this entry is closed by removing the override.

## 2026-09-20 · merge into `main` · size floors re-measured

- **Situation**: the harness was baselined on `security/guard-actions-and-routes`, a tree without the branding, contact and PWA work already on `main`. On merge the ratchet reported `size.overBudget` 31 → 34 and `size.excessCode` 5302 → 5307: `components/menu/restaurant-page.tsx` (603 code lines, budget 250), `app/restaurant/[slug]/page.tsx` (134 / 100), `components/branding/branding-panel.tsx` (287 / 250), `components/contact/contact-panel.tsx` (253 / 250).
- **Default taken**: `abatty baseline --reason --owner` on the merged tree; the two size floors now hold `main`'s true day-0 numbers. The other regressions were fixed, not re-baselined: `lib/env.ts` absorbs the five new `process.env` reads, `docs/README.md` lists every document.
- **Alternative set aside**: splitting the four files in the merge commit. The restaurant page is the customer-facing menu, just rebuilt with the PWA flow and without tests; its split (header, sections, PWA banners, footer are the seams) is a reviewed change of its own.
- **Re-read when**: the restaurant page is split. That drops `size.excessCode` by 353 and `size.overBudget` by 1; the three marginal files follow, and this entry is closed.

