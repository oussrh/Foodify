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
 * The index just past the bracket that closes the one at `open`, or -1. Strings, template
 * literals and comments are skipped so a brace in a message does not unbalance the count.
 * @param {string} text @param {number} open @param {string} pair the two brackets, e.g. "()"
 */
export function closeOf(text, open, pair) {
  const [l, r] = pair
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const ch = text[i]
    if (ch === '/' && text[i + 1] === '/') i = text.indexOf('\n', i)
    else if (ch === '/' && text[i + 1] === '*') i = text.indexOf('*/', i) + 1
    else if (ch === "'" || ch === '"' || ch === '`') {
      for (i++; i < text.length && text[i] !== ch; i++) if (text[i] === '\\') i++
    } else if (ch === l) depth++
    else if (ch === r && --depth === 0) return i + 1
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

/**
 * The names a parameter list binds: `a: T`, `b = 1`, `...rest`, and the members of a
 * destructured `{ params: p, x }`. Split on the commas at depth zero.
 * @param {string} params
 */
export function paramNames(params) {
  const names = []
  let depth = 0
  let start = 0
  const parts = []
  for (let i = 0; i <= params.length; i++) {
    const ch = params[i]
    if (ch === '{' || ch === '(' || ch === '[' || ch === '<') depth++
    else if (ch === '}' || ch === ')' || ch === ']' || ch === '>') depth--
    else if ((ch === ',' && depth === 0) || i === params.length) {
      parts.push(params.slice(start, i).trim())
      start = i + 1
    }
  }
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('{') || part.startsWith('[')) {
      const inner = part.slice(1, part.lastIndexOf(part[0] === '{' ? '}' : ']'))
      for (const member of inner.split(',')) {
        const m = member.trim().match(/^(?:\.\.\.)?(?:([A-Za-z_$][\w$]*)\s*:\s*)?([A-Za-z_$][\w$]*)/)
        if (m) names.push(m[2])
      }
    } else {
      const m = part.match(/^(?:\.\.\.)?([A-Za-z_$][\w$]*)/)
      if (m) names.push(m[1])
    }
  }
  return names
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
