// abatty-probes/api.mjs
// API.1 on this repository's surface: every route handler answers through the envelope
// (lib/api.ts), every list it serves is bounded and followable, and a server action returns a
// payload it shaped, never the ORM's row nor a bare boolean.
import { closeOf, lineAt } from './text.mjs'

const ROUTE_FILE = /(^|\/)app\/api\/.*route\.[jt]sx?$/
const USE_SERVER = /^\s*(['"])use server\1/m
// A Response built by hand in a handler: the envelope helpers are the only way out.
const BARE_RESPONSE = /\b(?:NextResponse|Response)\.json\s*\(|\bnew\s+(?:NextResponse|Response)\s*\(/g
// A list read in a handler: bounded by a take, or paged by the shared helper.
const FIND_MANY = /\.findMany\s*\(/g
const BOUNDED = /\btake\s*:|\bpageArgs\s*\(/
// A write whose row is returned as it came, and a boolean answer.
const WRITE = String.raw`prisma\.\w+\.(?:create|update|delete|upsert|updateMany|deleteMany)\s*\(`
const ROW_RETURN = new RegExp(String.raw`\breturn\s+(?:await\s+)?` + WRITE, 'g')
// A row kept in a local and returned later: the same row by another route.
const ROW_KEPT = new RegExp(String.raw`\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?` + WRITE, 'g')
const BOOL_RETURN = /\breturn\s+(?:true|false)\b/g
// What a select must never carry to a client.
const SECRET_FIELD = /\b(?:passwordHash|totpSecret|emailOtpCode|passwordResetToken|emailChangeToken|emailVerifyToken)\s*:\s*true\b/
// A comment is not code.
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '')

/** @type {import("abatty").Probe} */
export const bareResponse = {
  metric: 'api.bareResponse',
  kind: 'ratchet',
  standard: ['API.1'],
  title: 'Route handlers answering outside the envelope',
  why: "A client parses one shape: { data } or { data, meta } on success, { error, code } on failure. A Response built by hand in a handler is a second shape the client learns by accident. The count is the number of hand-built responses in app/api.",
  approximates: 'a text reading, comments removed, of Response.json, NextResponse.json and new Response in a route file; the helpers ok() and fail() of lib/api.ts are the envelope. A redirect (Response.redirect, NextResponse.redirect) carries no body and is not read.',
  axis: 'boundary-clarity',
  lossAt: 10,
  scan: (c) => {
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!ROUTE_FILE.test(f)) continue
      scanned++
      const text = stripComments(c.read(f))
      for (const m of text.matchAll(BARE_RESPONSE)) findings.push({ path: f, line: lineAt(text, m.index), detail: `hand-built response: ${m[0].trim()}` })
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'a Response.json and a new Response in a handler count',
      files: { 'app/api/x/route.ts': "export async function GET() {\n  if (Math.random() > 2) return new Response('no', { status: 400 })\n  return Response.json([])\n}\n" },
      expect: 2,
    },
    {
      name: 'the envelope helpers are clean, and so is Response.json in the module that defines them',
      files: { 'app/api/x/route.ts': "import { ok, fail } from '@/lib/api'\n// once answered Response.json([]) by hand\nexport async function GET() {\n  return ok([])\n}\n", 'lib/api.ts': "export const ok = (d) => Response.json({ data: d })\n" },
      expect: 0,
    },
  ],
}

/** @type {import("abatty").Probe} */
export const unboundedList = {
  metric: 'api.unboundedList',
  kind: 'ratchet',
  standard: ['API.1'],
  title: 'Route handlers serving an unbounded list',
  why: 'A list without a bound grows until it times out, on the one day it matters. Every list a route serves takes a limit and is followable by cursor (lib/schemas/list.ts). The count is the number of findMany calls in app/api with neither a take nor the page helper.',
  approximates: "a text reading: a .findMany( in a route file whose arguments carry neither `take:` nor `pageArgs(`. A server action's reads (getMenu, one restaurant's categories) are outside it: they are bounded by the tenant, not by a page.",
  axis: 'boundary-clarity',
  lossAt: 5,
  scan: (c) => {
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!ROUTE_FILE.test(f)) continue
      scanned++
      const text = c.read(f)
      for (const m of text.matchAll(FIND_MANY)) {
        const open = m.index + m[0].length - 1
        const end = closeOf(text, open, '()')
        const args = end > 0 ? text.slice(open, end) : ''
        if (!BOUNDED.test(args)) findings.push({ path: f, line: lineAt(text, m.index), detail: 'findMany without a bound' })
      }
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'a findMany with no take counts',
      files: { 'app/api/x/route.ts': "export async function GET() {\n  const rows = await prisma.user.findMany({ where: { role: 'X' }, orderBy: { id: 'asc' } })\n  return ok(rows)\n}\n" },
      expect: 1,
    },
    {
      name: 'a take, or the page helper, is a bound; a findMany outside app/api is not read',
      files: { 'app/api/x/route.ts': "export async function GET() {\n  const a = await prisma.user.findMany({ take: 50 })\n  const b = await prisma.user.findMany({ where: {}, ...pageArgs(q) })\n  return ok([a, b])\n}\n", 'lib/x.ts': "export const all = () => prisma.user.findMany()\n" },
      expect: 0,
    },
  ],
}

/** @type {import("abatty").Probe} */
export const rowReturn = {
  metric: 'api.rowReturn',
  kind: 'ratchet',
  standard: ['API.1'],
  title: 'Server actions returning a row or a boolean',
  why: "A mutation returns a payload the action shaped: a row returned as it came carries what the client must never see (a password hash) or cannot receive (a Decimal), and a boolean answers a question nobody can extend. The count is the number of writes returned without a select, plus the bare booleans, in 'use server' modules.",
  approximates: "a text reading, in a module that starts with 'use server', of `return prisma.<model>.<write>(` and of `const x = await prisma.<model>.<write>(` later returned as `x`, whose arguments carry no `select:`; of a select naming a secret column (passwordHash, the OTP and tokens); and of `return true` / `return false` anywhere in the module, a nested callback included. A `$transaction` returned whole is not read.",
  axis: 'boundary-clarity',
  lossAt: 20,
  scan: (c) => {
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!/\.[jt]sx?$/.test(f)) continue
      const text = c.read(f)
      if (!USE_SERVER.test(text)) continue
      scanned++
      const argsOf = (m) => {
        const open = m.index + m[0].length - 1
        const end = closeOf(text, open, '()')
        return end > 0 ? text.slice(open, end) : ''
      }
      for (const m of text.matchAll(ROW_RETURN)) {
        const args = argsOf(m)
        if (!/\bselect\s*:/.test(args)) findings.push({ path: f, line: lineAt(text, m.index), detail: 'a row returned as it came' })
        else if (SECRET_FIELD.test(args)) findings.push({ path: f, line: lineAt(text, m.index), detail: 'a select carrying a secret column' })
      }
      for (const m of text.matchAll(ROW_KEPT)) {
        const args = argsOf(m)
        const returned = new RegExp(String.raw`\breturn\s+${m[1]}\b`).test(text.slice(m.index))
        if (!returned) continue
        if (!/\bselect\s*:/.test(args)) findings.push({ path: f, line: lineAt(text, m.index), detail: `the row ${m[1]} returned as it came` })
        else if (SECRET_FIELD.test(args)) findings.push({ path: f, line: lineAt(text, m.index), detail: 'a select carrying a secret column' })
      }
      for (const m of text.matchAll(BOOL_RETURN)) findings.push({ path: f, line: lineAt(text, m.index), detail: 'a bare boolean answer' })
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'a write returned without a select, one kept in a local and returned, a select with a secret column, and a bare boolean count',
      files: { 'app/actions/a.ts': "'use server'\nexport async function create(raw: unknown) {\n  return prisma.user.create({ data: input.parse(raw) })\n}\nexport async function rename(raw: unknown) {\n  const row = await prisma.user.update({ where: { id: raw }, data: {} })\n  refresh()\n  return row\n}\nexport async function leak(raw: unknown) {\n  return prisma.user.update({ where: { id: raw }, data: {}, select: { id: true, passwordHash: true } })\n}\nexport async function confirm(t: string) {\n  if (!t) return false\n  return true\n}\n" },
      expect: 5,
    },
    {
      name: 'a selected payload, returned at once or kept in a local, and an object answer are clean; a module without the directive is not read',
      files: { 'app/actions/a.ts': "'use server'\nexport async function create(raw: unknown) {\n  return prisma.user.create({ data: input.parse(raw), select: { id: true } })\n}\nexport async function rename(raw: unknown) {\n  const row = await prisma.user.update({ where: { id: raw }, data: {}, select: { id: true } })\n  refresh()\n  return row\n}\nexport async function confirm(t: string) {\n  return { confirmed: Boolean(t) }\n}\n", 'lib/x.ts': "export const f = () => { return true }\n" },
      expect: 0,
    },
  ],
}

const FLOAT_MONEY = /\bprice\s*:\s*(?:Number|parseFloat|parseInt)\s*\(|\bprice\s*:\s*z\.(?:number|coerce\.number)\s*\(/g

/** @type {import("abatty").Probe} */
export const floatMoney = {
  metric: 'api.floatMoney',
  kind: 'ratchet',
  standard: ['API.1'],
  title: 'Money as a float on the wire',
  why: 'A monetary amount travels as an exact two-fraction-digit string beside its currency; a JavaScript number rounds on the way. The count is the number of places a price is made a number to send or to receive it: a field assigned Number()/parseFloat(), or a schema field typed z.number().',
  approximates: 'a text reading of `price: Number(`, `price: parseFloat(`, `price: parseInt(` and `price: z.number(` in the source. Arithmetic on a price already received (a formatter\'s Intl call) is not a wire crossing and is not read.',
  axis: 'boundary-clarity',
  lossAt: 10,
  scan: (c) => {
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!/\.[jt]sx?$/.test(f)) continue
      scanned++
      const text = stripComments(c.read(f))
      for (const m of text.matchAll(FLOAT_MONEY)) findings.push({ path: f, line: lineAt(text, m.index), detail: `money as a number: ${m[0].trim()}` })
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'a price made a number for the client, and a numeric price schema, count',
      files: { 'app/x/page.tsx': "export default async function Page() {\n  const rows = dishes.map((d) => ({ id: d.id, price: Number(d.price) }))\n  return <List rows={rows} />\n}\n", 'lib/schemas/d.ts': "export const dishInput = z.object({ price: z.number().min(0) })\n" },
      expect: 2,
    },
    {
      name: 'a two-decimal string, a decimal-string schema and a formatter\'s arithmetic are clean',
      files: { 'app/x/page.tsx': "export default async function Page() {\n  const rows = dishes.map((d) => ({ id: d.id, price: d.price.toFixed(2) }))\n  return <List rows={rows} />\n}\n", 'lib/schemas/d.ts': "export const dishInput = z.object({ price: money })\n", 'lib/menu.ts': "export function formatPrice(price: string) {\n  const amount = Number(price)\n  return amount.toFixed(2)\n}\n" },
      expect: 0,
    },
  ],
}
