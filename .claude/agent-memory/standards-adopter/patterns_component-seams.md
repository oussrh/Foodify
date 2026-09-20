---
name: patterns-component-seams
description: Seams that held when splitting oversized client components for the shape rules (uploads, model-viewer pages, QR dialog) and the two that a reviewer would call relocation
metadata:
  type: feedback
---

Split a fat client component by what each piece is FOR; these seams held on 2026-09-20.

**Why:** the shape rules (150 lines per .tsx function, 60 per .ts function, complexity 12)
are met by pieces with a name, not by moving the body into a hook.

**How to apply:**
- Four copies of one thing (a Cloudinary browser upload, a file check, a simulated
  progress bar, a success/error notice, a dashed drop zone) become ONE module each under
  `components/<area>/`, keeping every string; the components keep only what differs
  (which callback, which wording, which size limit). Never reuse a sibling module with
  different strings (lib/brand-upload.ts) for a behaviour-identical refactor.
- A progress hook that owns the run (`track({ upload, onUploaded, failure, onSettled })`)
  is the shared semantic, not a relocation: the upload, then the caller's work with the
  result, both inside one try so a throw anywhere shows the caller's message, and the
  1-second reset in `finally`. Keep the caller's input reset (`event.target.value = ''`)
  in the caller: which branch resets it differs per component.
- Word-and-size tables (`FORMATS`, `COPY`, `TONES`, `as const`) turn a JSX ternary forest
  into one lookup: complexity drops, Tailwind still sees the full class literals in the
  table. Icons go in the table as component references (`Icon: Smartphone`), rendered as
  `<f.Icon />` - allowed by react-hooks/static-components since nothing is created in render.
- Effect bodies that build a DOM element split into `applyXAttributes(el, ...)`,
  `createPoster()`, `createArButton()` in `.ts` files; the effect keeps only the wiring
  that needs setState. Order of setAttribute calls is behaviour (last value wins): transcribe.
- Files under components/ get the component budget (250) from the ratchet even as `.ts`;
  hold utilities to 100 and hooks to 150 anyway, and split at 5 exported functions.
- Two near-twin components (logo/cover) are not one parameterised component: keep two thin
  components over shared parts, so the asymmetry (cover persists its removal, logo does
  not) stays readable.
