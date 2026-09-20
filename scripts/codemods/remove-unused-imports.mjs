#!/usr/bin/env node
// scripts/codemods/remove-unused-imports.mjs
//
// Removes the import bindings ESLint reports as unused (@typescript-eslint/no-unused-vars) and
// nothing else: a binding that is unused but not an import is left for a person to judge.
// Driven by ESLint's JSON output so the codemod and the gate agree on what "unused" means.
//
//   node scripts/codemods/remove-unused-imports.mjs            # dry run: counts per file
//   node scripts/codemods/remove-unused-imports.mjs --write    # rewrite the files
//
// A whole import statement goes when none of its bindings survive; otherwise the statement is
// re-emitted with the survivors, one per line when it spanned lines, on one line otherwise.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const RULE = '@typescript-eslint/no-unused-vars';

/** ESLint findings for the rule, grouped by file: { [file]: Set<"line:column"> }. */
function unusedByFile(cwd) {
  let out = '';
  try {
    out = execFileSync('pnpm', ['exec', 'eslint', '.', '-f', 'json'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' });
  } catch (e) {
    out = e.stdout || ''; // eslint exits 1 with warnings; the JSON is still on stdout
  }
  const result = {};
  for (const file of JSON.parse(out)) {
    for (const m of file.messages) {
      if (m.ruleId !== RULE) continue;
      (result[file.filePath] ||= new Set()).add(`${m.line}:${m.column}`);
    }
  }
  return result;
}

/** "line:column" of a node's start, 1-based as ESLint reports positions. */
function positionOf(node, sf) {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return `${line + 1}:${character + 1}`;
}

/** The named bindings that survive, and how many were dropped. */
function keptNamed(named, marks, sf) {
  const kept = [];
  let dropped = 0;
  for (const el of named.elements) {
    if (marks.has(positionOf(el.name, sf))) dropped++;
    else kept.push(el.getText(sf));
  }
  return { kept, dropped };
}

/**
 * What one import declaration keeps once the marked bindings are gone.
 * @returns {{ dropped: number, keepDefault: boolean, namespace: string | null, kept: string[], multiline: boolean }}
 */
function planImport(stmt, marks, sf) {
  const clause = stmt.importClause;
  const bindings = clause.namedBindings;
  const keepDefault = Boolean(clause.name) && !marks.has(positionOf(clause.name, sf));
  let dropped = clause.name && !keepDefault ? 1 : 0;
  let namespace = null;
  let kept = [];
  let multiline = false;
  if (bindings && ts.isNamespaceImport(bindings)) {
    if (marks.has(positionOf(bindings.name, sf))) dropped++;
    else namespace = bindings.name.text;
  } else if (bindings && ts.isNamedImports(bindings)) {
    const named = keptNamed(bindings, marks, sf);
    kept = named.kept;
    dropped += named.dropped;
    multiline = /\n/.test(bindings.getText(sf));
  }
  return { dropped, keepDefault, namespace, kept, multiline };
}

/** The edit that removes a whole statement: its lines, a trailing comment on its last line, and the line break after it. */
function dropStatement(text, stmt, sf) {
  const start = text.lastIndexOf('\n', stmt.getStart(sf)) + 1;
  const lineEnd = text.indexOf('\n', stmt.getEnd());
  const rest = text.slice(stmt.getEnd(), lineEnd < 0 ? text.length : lineEnd);
  const trailingIsComment = /^\s*(\/\/.*|\/\*.*\*\/\s*)?$/.test(rest);
  let end = trailingIsComment && lineEnd >= 0 ? lineEnd + 1 : stmt.getEnd();
  if (!trailingIsComment && text[end] === '\r') end++;
  if (!trailingIsComment && text[end] === '\n') end++;
  return { start, end, replacement: '' };
}

/** The edit that re-emits a statement with its surviving bindings, keeping its leading trivia, `type` and semicolon. */
function reemitStatement(text, stmt, sf, plan) {
  const clause = stmt.importClause;
  const parts = [];
  if (plan.keepDefault) parts.push(clause.name.text);
  if (plan.namespace) parts.push(`* as ${plan.namespace}`);
  if (plan.kept.length) parts.push(plan.multiline ? `{\n  ${plan.kept.join(',\n  ')},\n}` : `{ ${plan.kept.join(', ')} }`);
  const typeOnly = clause.isTypeOnly ? 'type ' : '';
  const moduleText = stmt.moduleSpecifier.getText(sf);
  const semicolon = text.slice(stmt.getStart(sf), stmt.getEnd()).trimEnd().endsWith(';') ? ';' : '';
  const leading = text.slice(stmt.getFullStart(), stmt.getStart(sf));
  return { start: stmt.getFullStart(), end: stmt.getEnd(), replacement: `${leading}import ${typeOnly}${parts.join(', ')} from ${moduleText}${semicolon}` };
}

/**
 * Rewrite one source text, dropping the import bindings whose name starts at one of `marks`
 * ("line:column", 1-based as ESLint reports). Returns { text, removed, statements }.
 */
export function removeUnusedImports(text, marks, fileName = 'file.tsx') {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  let removed = 0;
  let statements = 0;
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
    const plan = planImport(stmt, marks, sf);
    if (plan.dropped === 0) continue;
    removed += plan.dropped;
    const survivors = (plan.keepDefault ? 1 : 0) + plan.kept.length + (plan.namespace ? 1 : 0);
    if (survivors === 0) statements++;
    edits.push(survivors === 0 ? dropStatement(text, stmt, sf) : reemitStatement(text, stmt, sf, plan));
  }
  let out = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  return { text: out, removed, statements };
}

function main() {
  const write = process.argv.includes('--write');
  const cwd = process.cwd();
  const findings = unusedByFile(cwd);
  let files = 0;
  let bindings = 0;
  let statements = 0;
  for (const [file, marks] of Object.entries(findings)) {
    const before = readFileSync(file, 'utf8');
    const { text, removed, statements: dropped } = removeUnusedImports(before, marks, file);
    if (removed === 0) continue;
    files++;
    bindings += removed;
    statements += dropped;
    console.log(`${write ? 'rewrote' : 'would rewrite'} ${relative(cwd, file)}: ${removed} binding(s), ${dropped} whole statement(s)`);
    if (write) writeFileSync(file, text);
  }
  console.log(`${write ? 'removed' : 'would remove'} ${bindings} unused import binding(s) in ${files} file(s) (${statements} whole statements)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
