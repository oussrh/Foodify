// abatty.probes.mjs
// The repository's own ratchet probes (abatty.config.json → ratchet.local). Each one proves
// itself on its control cases: `pnpm exec abatty ratchet --controls`. They are text probes, a
// proxy for the rule, and say so in their `approximates`.

// A zod parse: the method call whose argument is read below. JSON.parse and Date.parse are not one.
const PARSE_CALL = /(?<!JSON|Date)\.(parse|safeParse|parseAsync|safeParseAsync)\(/g
// What a route handler reads from the request: the body, the query, the path.
const READS_INPUT = /\.(json|formData|text)\(\)|searchParams|\bparams\b/
const ROUTE_FILE = /(^|\/)app\/api\/.*route\.[jt]sx?$/
const USE_SERVER = /^\s*(['"])use server\1/m
const HTTP_METHOD = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/
// Every way a module exports a function: declarations, default, const arrow, const function.
const EXPORTED_FN =
  /export\s+(?:default\s+)?(?:async\s+)?function\s*(?:\*\s*)?([A-Za-z_$][\w$]*)?\s*\(|export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\s*(?:[A-Za-z_$][\w$]*)?\s*)?\(/g
const AUTHORIZE = /\bauthorize\s*\(/g
// The environment object taken whole: destructured, aliased or passed on, which the built-in
// read probe (a member read, an index) cannot see. Spelled apart so the probes do not count
// their own text.
const ENV = 'process' + '.env'
const WHOLE_ENV = new RegExp(`\\b${ENV.replace('.', '\\.')}\\b(?![.[])`, 'g')

const lineAt = (text, index) => text.slice(0, index).split('\n').length

/**
 * The index just past the bracket that closes the one at `open`, or -1. Strings, template
 * literals and comments are skipped so a brace in a message does not unbalance the count.
 * @param {string} text @param {number} open @param {string} pair the two brackets, e.g. "()"
 */
function closeOf(text, open, pair) {
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
function bodyStart(text, from) {
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
function functionAt(text, paren) {
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
function paramNames(params) {
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
function parsedArguments(body) {
  const args = []
  for (const m of body.matchAll(PARSE_CALL)) {
    const open = m.index + m[0].length - 1
    const end = closeOf(body, open, '()')
    if (end > 0) args.push(body.slice(open + 1, end - 1))
  }
  return args
}

/** The parameters no parse call names. @param {string[]} params @param {string} body */
function unparsedParams(params, body) {
  const args = parsedArguments(body)
  return params.filter((p) => !args.some((a) => new RegExp(`\\b${p}\\b`).test(a)))
}

/** Every exported function of a module: its name and the index of its `(`. @param {string} text */
function exportedFunctions(text) {
  const out = []
  for (const m of text.matchAll(EXPORTED_FN)) out.push({ name: m[1] || m[2] || 'default', index: m.index, paren: m.index + m[0].length - 1 })
  return out
}

/** @type {import("abatty").Probe[]} */
export const probes = [
  {
    metric: 'valid.unparsedBoundary',
    kind: 'ratchet',
    standard: ['VALID.1'],
    title: 'Boundaries that read input without a schema',
    why: 'A route handler, a server action or a credentials callback is a public POST endpoint: its TypeScript parameter type is a promise the caller need not keep. A zod parse at the top makes the type true at runtime. The count is the number of boundaries still trusting some of their input.',
    approximates:
      'a text reading: an exported function of a route file, a "use server" module or an authorize() callback; a parse is a .parse/.safeParse call (JSON and Date excluded) whose argument names the parameter. For a route handler the reads of the request are matched by name and one parse in the body counts for all of them.',
    axis: 'boundary-clarity',
    lossAt: 40,
    scan: (c) => {
      const findings = []
      let scanned = 0
      for (const f of c.sourceFiles) {
        if (!/\.[jt]sx?$/.test(f)) continue
        const text = c.read(f)
        const isRoute = ROUTE_FILE.test(f)
        const isAction = USE_SERVER.test(text)
        const isAuth = AUTHORIZE.test(text)
        AUTHORIZE.lastIndex = 0
        if (!isRoute && !isAction && !isAuth) continue
        scanned++
        for (const { name, index, paren } of exportedFunctions(text)) {
          const fn = functionAt(text, paren)
          if (!fn) continue
          const line = lineAt(text, index)
          if (isRoute) {
            if (HTTP_METHOD.test(name) && READS_INPUT.test(fn.body) && parsedArguments(fn.body).length === 0)
              findings.push({ path: f, line, detail: `${name} reads the request without a schema` })
          } else if (isAction) {
            const missing = unparsedParams(fn.params, fn.body)
            if (missing.length)
              findings.push({ path: f, line, detail: `server action ${name}: no parse names ${missing.join(', ')}` })
          }
        }
        if (isAuth)
          for (const m of text.matchAll(AUTHORIZE)) {
            const fn = functionAt(text, m.index + m[0].length - 1)
            if (fn && unparsedParams(fn.params, fn.body).length)
              findings.push({ path: f, line: lineAt(text, m.index), detail: 'authorize() reads the credentials without a schema' })
          }
      }
      return { scanned, findings }
    },
    controls: [
      {
        name: 'a route handler that reads the body and never parses it counts',
        files: { 'app/api/x/route.ts': "export async function POST(req: Request) {\n  const { a } = await req.json()\n  return Response.json({ a })\n}\n" },
        expect: 1,
      },
      {
        name: 'a route handler that parses the body is clean, whatever braces its return type holds',
        files: { 'app/api/x/route.ts': "import { z } from 'zod'\nconst s = z.object({ a: z.string() })\nexport async function POST(req: Request): Promise<Response | { ok: boolean }> {\n  const r = s.safeParse(await req.json())\n  return Response.json(r)\n}\n" },
        expect: 0,
      },
      {
        name: 'a route handler that reads nothing is clean; a sync one that reads the query counts',
        files: { 'app/api/x/route.ts': "export async function GET() {\n  return Response.json([])\n}\nexport function HEAD(request: Request) {\n  const q = new URL(request.url).searchParams\n  return new Response(null, { status: q.has('x') ? 200 : 404 })\n}\n" },
        expect: 1,
      },
      {
        name: 'a server action with arguments and no parse counts, whatever braces its type holds',
        files: { 'app/actions/a.ts': "'use server'\nexport async function create(id: string, data: { name: string; tags?: string[] }) {\n  console.log('saving {', { id, data })\n  return data\n}\n" },
        expect: 1,
      },
      {
        name: 'a server action that parses every argument is clean; one without arguments too',
        files: { 'app/actions/a.ts': "'use server'\nimport { input, uuid } from '@/lib/schemas/a'\nexport async function create(rawId: string, raw: unknown) {\n  const id = uuid.parse(rawId)\n  const data = input.parse(raw)\n  return { id, data }\n}\nexport async function list() {\n  return []\n}\n" },
        expect: 0,
      },
      {
        name: 'a server action that parses one argument and passes the other through counts',
        files: { 'app/actions/a.ts': "'use server'\nimport { input } from '@/lib/schemas/a'\nexport async function create(raw: unknown, ip?: string) {\n  const data = input.parse(raw)\n  return { data, ip }\n}\n" },
        expect: 1,
      },
      {
        name: 'an arrow action with a block or an expression body, a const function action and a default export are scanned too',
        files: { 'app/actions/a.ts': "'use server'\nexport const create = async (data: { name: string }) => {\n  return data\n}\nexport const rename = async (data: { name: string }) => data.name\nexport const update = async function (id: string) {\n  return id\n}\nexport default async function remove(id: string) {\n  return id\n}\n" },
        expect: 4,
      },
      {
        name: 'JSON.parse is not a schema, and neither is a parse of something else',
        files: { 'app/actions/a.ts': "'use server'\nimport { s } from '@/lib/schemas/a'\nexport async function create(raw: string) {\n  s.parse({})\n  return JSON.parse(raw)\n}\n" },
        expect: 1,
      },
      {
        name: 'an exported function of an ordinary module is not a boundary',
        files: { 'lib/money.ts': "export async function format(amount: number) {\n  return String(amount)\n}\n" },
        expect: 0,
      },
      {
        name: 'a credentials callback that casts instead of parsing counts; one that parses is clean',
        files: {
          'auth.ts': "export const config = {\n  providers: [{\n    async authorize(credentials) {\n      const { email } = credentials as Record<string, string>\n      return { email }\n    },\n  }],\n}\n",
          'auth2.ts': "import { s } from './lib/schemas/user'\nexport const config = {\n  providers: [{\n    async authorize(raw) {\n      const parsed = s.safeParse(raw)\n      return parsed.success ? parsed.data : null\n    },\n  }],\n}\n",
        },
        expect: 1,
      },
    ],
  },
  {
    metric: 'valid.wholeEnv',
    kind: 'ratchet',
    standard: ['VALID.3'],
    title: 'The environment object taken whole outside the env module',
    why: 'The built-in read probe sees a member read of the environment; a destructuring, an alias or a function given the whole object reads the same variables past it. The count is the number of such takes outside the env module.',
    approximates: 'a text reading of the environment object not followed by a member read or an index, outside the env module',
    axis: 'boundary-clarity',
    lossAt: 10,
    scan: (c, o) => {
      const env = new RegExp(o.config.envModule)
      const findings = []
      let scanned = 0
      for (const f of c.sourceFiles) {
        if (!/\.[cm]?[jt]sx?$/.test(f) || env.test(f)) continue
        scanned++
        const text = c.read(f)
        for (const m of text.matchAll(WHOLE_ENV)) findings.push({ path: f, line: lineAt(text, m.index), detail: `${ENV} taken whole` })
      }
      return { scanned, findings }
    },
    controls: [
      {
        name: 'a destructuring of the environment in a service counts, and so does passing it on',
        files: { 'src/service.ts': `const { KEY } = ${ENV}\nexport const k = KEY\nexport const all = () => run(${ENV})\n` },
        expect: 2,
      },
      {
        name: 'the env module may take it whole; a read of one variable elsewhere is the other probe\'s',
        files: { 'src/env.ts': `export const env = schema.parse(${ENV})\n`, 'src/service.ts': `export const k = ${ENV}.KEY\n` },
        expect: 0,
      },
    ],
  },
]
