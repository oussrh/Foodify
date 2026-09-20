# Lessons

What we learned the hard way, one entry per lesson, newest first. A line added to `CLAUDE.md`
should trace back to an entry here (the ratchet checks that a push which grows the context file
also touches this catalogue).

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
