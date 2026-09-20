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

/**
 * Rewrite one source text, dropping the import bindings whose name starts at one of `marks`
 * ("line:column", 1-based as ESLint reports). Returns { text, removed, statements }.
 */
export function removeUnusedImports(text, marks, fileName = 'file.tsx') {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const at = (node) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    return `${line + 1}:${character + 1}`;
  };
  const edits = []; // { start, end, replacement }
  let removed = 0;
  let statements = 0;
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
    const clause = stmt.importClause;
    const keepDefault = clause.name ? !marks.has(at(clause.name)) : false;
    const bindings = clause.namedBindings;
    let namespace = null;
    let kept = [];
    let dropped = 0;
    if (bindings && ts.isNamespaceImport(bindings)) {
      namespace = marks.has(at(bindings.name)) ? null : bindings.name.text;
      if (!namespace) dropped++;
    } else if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        if (marks.has(at(el.name))) dropped++;
        else kept.push(el.getText(sf));
      }
    }
    if (clause.name && !keepDefault) dropped++;
    if (dropped === 0) continue;
    removed += dropped;
    const hadDefault = Boolean(clause.name);
    const hadNamed = Boolean(bindings && ts.isNamedImports(bindings) && bindings.elements.length);
    const survivors = (keepDefault ? 1 : 0) + kept.length + (namespace ? 1 : 0);
    const fullStart = stmt.getFullStart();
    const end = stmt.getEnd();
    if (survivors === 0) {
      statements++;
      // Drop the statement's own lines: from the start of its first line (comments above it
      // stay) through the line break that followed it.
      const lineStart = text.lastIndexOf('\n', stmt.getStart(sf)) + 1;
      let cut = end;
      if (text[cut] === '\r') cut++;
      if (text[cut] === '\n') cut++;
      edits.push({ start: lineStart, end: cut, replacement: '' });
      continue;
    }
    const typeOnly = clause.isTypeOnly ? 'type ' : '';
    const moduleText = stmt.moduleSpecifier.getText(sf);
    const multiline = hadNamed && /\n/.test(bindings.getText(sf));
    const parts = [];
    if (keepDefault) parts.push(clause.name.text);
    if (namespace) parts.push(`* as ${namespace}`);
    if (kept.length) {
      parts.push(multiline ? `{\n  ${kept.join(',\n  ')},\n}` : `{ ${kept.join(', ')} }`);
    }
    const semicolon = text.slice(stmt.getStart(sf), end).trimEnd().endsWith(';') ? ';' : '';
    const leading = text.slice(fullStart, stmt.getStart(sf));
    edits.push({ start: fullStart, end, replacement: `${leading}import ${typeOnly}${parts.join(', ')} from ${moduleText}${semicolon}` });
    void hadDefault;
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
