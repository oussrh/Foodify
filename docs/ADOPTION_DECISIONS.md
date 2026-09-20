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

