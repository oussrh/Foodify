---
name: patterns-mutation-restore
description: Trap - restoring a mutation-tested file with `git checkout --` wipes the refactor in progress; undo the mutation with the inverse edit instead
metadata:
  type: feedback
---

When mutation-testing a harness on a file you have already refactored in the working tree,
undo the mutation with the inverse edit (sed back, or Edit), never `git checkout -- <file>`.

**Why:** On 2026-09-20 (phase 7, T4) I flipped one class in a refactored page to prove the
render-diff harness went red, then `git checkout -- page.tsx` to "restore" it: that restored
HEAD and silently threw away the refactor. `git status` caught it; a second agent's work in
the same tree would not have been so visible.

**How to apply:** Mutate with `sed -i 's/A/B/'`, restore with `sed -i 's/B/A/'`, then
`git diff --stat <file>` must still show the refactor's line counts. Reserve `git checkout --`
for files you have not touched in this session.
