---
name: patterns-windows-bash-tool
description: Trap - on this Windows checkout the Bash tool unescapes backslashes and rejects some multi-file heredocs; write source files with Write, do multi-line edits with a python3 heredoc, keep eslint argument lists short
metadata:
  type: project
---

On this repository's Windows machine the Bash tool (Git Bash) turned `\\d` into `\d` inside a
quoted `<<'PY'` heredoc and rejected a four-file `cat <<'EOF'` batch with "unexpected EOF while
looking for matching `''" without writing anything.

**Why:** hit on 2026-09-20 (phase 7, T1) while creating the `components/menu/restaurant-page/`
files.

**How to apply:** create source files with the Write tool; for surgical multi-line edits use a
`python3 - <<'PY'` script with `pathlib` (`read_text`/`write_text(..., newline='\n')`, the repo
is LF via `.gitattributes`) and `assert old in s` before each replace; avoid regex escapes in
those scripts or put the script in a file with Write. `pnpm exec eslint <many files>` hits
"La ligne de commande est trop longue" - pass directories instead. `pnpm exec eslint --rule
'complexity: [error, 12]' ...` on the CLI overrides the config's exemption `off`, which is how
to measure a listed file before it is fixed; `node scripts/codemods/shape-exemptions.mjs
--check` printing `stale exemption: <file>` is the success signal.
