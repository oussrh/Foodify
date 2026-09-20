// abatty.probes.mjs
// The repository's own ratchet probes (abatty.config.json → ratchet.local). Each one proves
// itself on its control cases: `pnpm exec abatty ratchet --controls`.

// A zod parse on the value that crossed the boundary. JSON.parse and Date.parse are not one.
const PARSE = /(?<!JSON|Date)\.(parse|safeParse|parseAsync|safeParseAsync)\(/
// What a route handler reads from the request: the body, the query, the path.
const READS_INPUT = /\.(json|formData|text)\(\)|searchParams|\bparams\b/
const ROUTE_FILE = /(^|\/)app\/api\/.*route\.[jt]sx?$/
const USE_SERVER = /^\s*(['"])use server\1/m
const HANDLER = /export\s+async\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g
const HTTP_METHOD = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/
const AUTHORIZE = /\bauthorize\s*\(/g

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
 * The parameter list and the body of the function whose `(` sits at `paren`.
 * @param {string} text @param {number} paren
 */
function functionAt(text, paren) {
  const paramsEnd = closeOf(text, paren, '()')
  if (paramsEnd < 0) return null
  const brace = text.indexOf('{', paramsEnd)
  if (brace < 0) return null
  const bodyEnd = closeOf(text, brace, '{}')
  if (bodyEnd < 0) return null
  return { params: text.slice(paren + 1, paramsEnd - 1).trim(), body: text.slice(brace, bodyEnd) }
}

/** @type {import("abatty").Probe[]} */
export const probes = [
  {
    metric: 'valid.unparsedBoundary',
    kind: 'ratchet',
    standard: ['VALID.1'],
    title: 'Boundaries that read input without a schema',
    why: 'A route handler, a server action or a credentials callback is a public POST endpoint: its TypeScript parameter type is a promise the caller need not keep. A zod parse at the top makes the type true at runtime. The count is the number of boundaries still trusting their input.',
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
        for (const m of text.matchAll(HANDLER)) {
          const fn = functionAt(text, m.index + m[0].length - 1)
          if (!fn) continue
          const name = m[1]
          if (isRoute && HTTP_METHOD.test(name) && READS_INPUT.test(fn.params + fn.body) && !PARSE.test(fn.body))
            findings.push({ path: f, line: lineAt(text, m.index), detail: `${name} reads the request without a schema` })
          else if (isAction && !isRoute && fn.params && !PARSE.test(fn.body))
            findings.push({ path: f, line: lineAt(text, m.index), detail: `server action ${name} takes ${fn.params.split(',').length} argument(s) without a schema` })
        }
        if (isAuth)
          for (const m of text.matchAll(AUTHORIZE)) {
            const fn = functionAt(text, m.index + m[0].length - 1)
            if (fn && fn.params && !PARSE.test(fn.body))
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
        name: 'a route handler that parses the body is clean',
        files: { 'app/api/x/route.ts': "import { z } from 'zod'\nconst s = z.object({ a: z.string() })\nexport async function POST(req: Request) {\n  const r = s.safeParse(await req.json())\n  return Response.json(r)\n}\n" },
        expect: 0,
      },
      {
        name: 'a route handler that reads nothing is clean',
        files: { 'app/api/x/route.ts': "export async function GET() {\n  return Response.json([])\n}\n" },
        expect: 0,
      },
      {
        name: 'a server action with arguments and no parse counts, whatever braces its type holds',
        files: { 'app/actions/a.ts': "'use server'\nexport async function create(id: string, data: { name: string; tags?: string[] }) {\n  console.log('saving {', { id, data })\n  return data\n}\n" },
        expect: 1,
      },
      {
        name: 'a server action that parses its arguments is clean; one without arguments too',
        files: { 'app/actions/a.ts': "'use server'\nimport { input } from '@/lib/schemas/a'\nexport async function create(raw: unknown) {\n  const data = input.parse(raw)\n  return data\n}\nexport async function list() {\n  return []\n}\n" },
        expect: 0,
      },
      {
        name: 'JSON.parse is not a schema',
        files: { 'app/actions/a.ts': "'use server'\nexport async function create(raw: string) {\n  return JSON.parse(raw)\n}\n" },
        expect: 1,
      },
      {
        name: 'an exported function of an ordinary module is not a boundary',
        files: { 'lib/money.ts': "export async function format(amount: number) {\n  return String(amount)\n}\n" },
        expect: 0,
      },
      {
        name: 'a credentials callback that casts instead of parsing counts',
        files: { 'auth.ts': "export const config = {\n  providers: [{\n    async authorize(credentials) {\n      const { email } = credentials as Record<string, string>\n      return { email }\n    },\n  }],\n}\n" },
        expect: 1,
      },
    ],
  },
]
