// abatty-probes/cache.mjs
// CACHE.1, CACHE.2: what creates a cached read on the server (phase 5's decision: nothing does).
import { lineAt } from './text.mjs'


// A server-side cache of a read: Next's cache directives and helpers, a cache store client.
// The dashboards render per request and cache nothing (phase 5's decision); a cache re-opens
// the phase's rules (a key with every parameter, an invalidation on every write, a TTL).
// What creates a cached read: a cache directive (plain, private or remote), a cache helper, a
// static or revalidating route export, a fetch cache option, a cache store client. What
// invalidates one (revalidatePath, revalidateTag, updateTag) is the write doing its duty and
// is not counted.
const SERVER_CACHE =
  /\bunstable_cache\s*\(|(['"])use cache(?::\s*\w+)?\1|\bcacheLife\s*\(|\bcacheTag\s*\(|^\s*export const revalidate\s*=|^\s*export const dynamic\s*=\s*['"]force-static['"]|\bgenerateStaticParams\b|\bnext:\s*\{[^}]*\brevalidate\b|\bcache:\s*['"]force-cache['"]|from\s+['"](?:ioredis|redis|@upstash\/redis|@vercel\/kv|memcached|lru-cache)['"]/gm

/** @type {import("abatty").Probe} */
export const serverCacheUse = {
  metric: 'cache.serverCacheUse',
  kind: 'ratchet',
  standard: ['CACHE.1', 'CACHE.2'],
  title: 'Server-side caches of a read',
  why: 'This application caches no read on the server: every dashboard and menu render reads the database (phase 5, docs/ADOPTION_DECISIONS.md), which is cheaper to guarantee than an invalidation scheme. The count is the number of places that started caching; each one owes CACHE.1 a key with every parameter, an invalidation on every write and a TTL, and the decision its re-reading.',
  approximates:
    'a text reading of what creates a cached read: "use cache" (plain, private, remote), unstable_cache, cacheLife, cacheTag, export const revalidate, export const dynamic = "force-static", generateStaticParams, a fetch with next.revalidate or cache: "force-cache", and an import of a cache store or lru-cache. Blind to a cache written by hand over a Map, to next.config.js (staleTimes, cacheComponents: outside the source globs) and to a directive in a comment. revalidatePath, revalidateTag and updateTag are invalidations, not caches, and are not counted.',
  axis: 'boundary-clarity',
  lossAt: 5,
  scan: (c) => {
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!/\.[jt]sx?$/.test(f)) continue
      scanned++
      const text = c.read(f)
      for (const m of text.matchAll(SERVER_CACHE)) findings.push({ path: f, line: lineAt(text, m.index), detail: `server cache: ${m[0].trim()}` })
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'a cached read, the three directive forms, a static route and a fetch cache count, once each',
      files: {
        'lib/a.ts': "import { unstable_cache } from 'next/cache'\nexport const read = unstable_cache(async () => 1, ['a'])\nexport const r = () => fetch('https://x', { next: { revalidate: 60 } })\n",
        'app/b/page.tsx': "export default async function Page() {\n  'use cache'\n  return null\n}\n",
        'app/c/page.tsx': "export default async function Page() {\n  'use cache: private'\n  return null\n}\n",
        'app/d/page.tsx': "export const dynamic = 'force-static'\nexport default function Page() {\n  return null\n}\n",
      },
      expect: 5,
    },
    {
      name: 'a plain database read, an invalidation and the browser cache API are not a server cache',
      files: { 'lib/a.ts': "import { revalidatePath } from 'next/cache'\nexport const read = () => prisma.dish.findMany()\nexport const write = () => revalidatePath('/admin', 'layout')\n", 'components/sw.ts': "export const open = () => caches.open('menu')\n" },
      expect: 0,
    },
  ],
}
