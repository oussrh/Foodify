// abatty-probes/boundary.mjs
// VALID.1: a route handler, a server action or a credentials callback that reads input no zod
// parse names.
import { exportedFunctions, functionAt, lineAt, parsedArguments, unparsedParams } from './text.mjs'

// What a route handler reads from the request: the body, the query, the path.
const READS_INPUT = /\.(json|formData|text)\(\)|searchParams|\bparams\b/
const ROUTE_FILE = /(^|\/)app\/api\/.*route\.[jt]sx?$/
const USE_SERVER = /^\s*(['"])use server\1/m
const HTTP_METHOD = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/
const AUTHORIZE = /\bauthorize\s*\(/g

/** @type {import("abatty").Probe} */
export const unparsedBoundary = {
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
}
