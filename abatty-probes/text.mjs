// abatty-probes/text.mjs
// The source-text readings the probes share: a matching bracket, a function's parameters and
// body, the arguments of every zod parse call, the exported functions of a module.

// A zod parse: the method call whose argument is read below. JSON.parse and Date.parse are not one.
const PARSE_CALL = /(?<!JSON|Date)\.(parse|safeParse|parseAsync|safeParseAsync)\(/g
// Every way a module exports a function: declarations, default, const arrow, const function.
const EXPORTED_FN =
  /export\s+(?:default\s+)?(?:async\s+)?function\s*(?:\*\s*)?([A-Za-z_$][\w$]*)?\s*\(|export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\s*(?:[A-Za-z_$][\w$]*)?\s*)?\(/g

export const lineAt = (text, index) => text.slice(0, index).split('\n').length

/**
 * The index of the quote that closes the string or template literal opened at `i` (an escaped
 * quote does not close it), or `text.length` when none does.
 * @param {string} text @param {number} i
 */
function stringEnd(text, i) {
  const quote = text[i]
  for (i++; i < text.length && text[i] !== quote; i++) if (text[i] === '\\') i++
  return i
}

/**
 * The index of the last character of the comment or string literal that starts at `i`, or null
 * when none starts there. A line comment with no newline after it ends at -1, as `indexOf` says.
 * @param {string} text @param {number} i
 * @returns {number | null}
 */
function literalEnd(text, i) {
  const ch = text[i]
  if (ch === '/' && text[i + 1] === '/') return text.indexOf('\n', i)
  if (ch === '/' && text[i + 1] === '*') return text.indexOf('*/', i) + 1
  if (ch === "'" || ch === '"' || ch === '`') return stringEnd(text, i)
  return null
}

/**
 * The index just past the bracket that closes the one at `open`, or -1. Strings, template
 * literals and comments are skipped so a brace in a message does not unbalance the count.
 * @param {string} text @param {number} open @param {string} pair the two brackets, e.g. "()"
 */
export function closeOf(text, open, pair) {
  const [l, r] = pair
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const skipTo = literalEnd(text, i)
    if (skipTo !== null) i = skipTo
    else if (text[i] === l) depth++
    else if (text[i] === r && --depth === 0) return i + 1
    if (i < 0) return -1
  }
  return -1
}

/**
 * Where the body starts after a parameter list: past a return type (`: Promise<{ ok }>` holds
 * braces of its own inside its angle brackets) and past `=>`. A `{` opens a block; anything
 * else after `=>` is an expression body, which runs to the end of its line; null at a `;`.
 * @param {string} text @param {number} from
 * @returns {{ at: number, block: boolean } | null}
 */
export function bodyStart(text, from) {
  let angle = 0
  for (let i = from; i < text.length; i++) {
    const ch = text[i]
    if (ch === '<') angle++
    else if (ch === '>' && text[i - 1] !== '=') angle--
    else if (ch === '{' && angle === 0) return { at: i, block: true }
    else if (ch === '>' && text[i - 1] === '=' && angle === 0) {
      const rest = text.slice(i + 1).match(/^\s*/)[0].length
      if (text[i + 1 + rest] !== '{') return { at: i + 1 + rest, block: false }
    } else if (ch === ';') return null
  }
  return null
}

/**
 * The parameter names and the body of the function whose `(` sits at `paren`, or null.
 * @param {string} text @param {number} paren
 */
export function functionAt(text, paren) {
  const paramsEnd = closeOf(text, paren, '()')
  if (paramsEnd < 0) return null
  const start = bodyStart(text, paramsEnd)
  if (!start) return null
  const bodyEnd = start.block ? closeOf(text, start.at, '{}') : text.indexOf('\n', start.at)
  if (bodyEnd < 0) return null
  return { params: paramNames(text.slice(paren + 1, paramsEnd - 1)), body: text.slice(start.at, bodyEnd) }
}

// What a bracket does to the nesting depth of a parameter list; a type's angle brackets count too.
const DEPTH_STEP = { '{': 1, '(': 1, '[': 1, '<': 1, '}': -1, ')': -1, ']': -1, '>': -1 }

/**
 * A parameter list split on the commas at depth zero, each part trimmed (an empty part for a
 * trailing comma or an empty list).
 * @param {string} params
 */
function topLevelParts(params) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i <= params.length; i++) {
    const ch = params[i]
    depth += DEPTH_STEP[ch] ?? 0
    if ((ch === ',' && depth === 0) || i === params.length) {
      parts.push(params.slice(start, i).trim())
      start = i + 1
    }
  }
  return parts
}

/**
 * The names one parameter binds: the identifier of `a: T`, `b = 1` or `...rest`; every member
 * of a destructured `{ params: p, x }` or `[a, b]` (the bound name, not the key).
 * @param {string} part
 */
function boundNames(part) {
  if (!part.startsWith('{') && !part.startsWith('[')) {
    const m = part.match(/^(?:\.\.\.)?([A-Za-z_$][\w$]*)/)
    return m ? [m[1]] : []
  }
  const names = []
  const inner = part.slice(1, part.lastIndexOf(part[0] === '{' ? '}' : ']'))
  for (const member of inner.split(',')) {
    const m = member.trim().match(/^(?:\.\.\.)?(?:([A-Za-z_$][\w$]*)\s*:\s*)?([A-Za-z_$][\w$]*)/)
    if (m) names.push(m[2])
  }
  return names
}

/**
 * The names a parameter list binds: `a: T`, `b = 1`, `...rest`, and the members of a
 * destructured `{ params: p, x }`. Split on the commas at depth zero.
 * @param {string} params
 */
export function paramNames(params) {
  return topLevelParts(params)
    .filter(Boolean)
    .flatMap((part) => boundNames(part))
}

/** The argument text of every zod parse call in a body. @param {string} body */
export function parsedArguments(body) {
  const args = []
  for (const m of body.matchAll(PARSE_CALL)) {
    const open = m.index + m[0].length - 1
    const end = closeOf(body, open, '()')
    if (end > 0) args.push(body.slice(open + 1, end - 1))
  }
  return args
}

/** The parameters no parse call names. @param {string[]} params @param {string} body */
export function unparsedParams(params, body) {
  const args = parsedArguments(body)
  return params.filter((p) => !args.some((a) => new RegExp(`\\b${p}\\b`).test(a)))
}

/** Every exported function of a module: its name and the index of its `(`. @param {string} text */
export function exportedFunctions(text) {
  const out = []
  for (const m of text.matchAll(EXPORTED_FN)) out.push({ name: m[1] || m[2] || 'default', index: m.index, paren: m.index + m[0].length - 1 })
  return out
}
