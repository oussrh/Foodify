// abatty-probes/auth.mjs
// CACHE.2, AUTH.1: every admin page re-checks the role first.
import { functionAt, lineAt } from './text.mjs'

/** @type {import("abatty").Probe} */
export const unguardedAdminPage = {
  metric: 'auth.unguardedAdminPage',
  kind: 'ratchet',
  standard: ['CACHE.2', 'AUTH.1'],
  title: 'Admin pages that do not re-check the role first',
  why: 'Next keeps a layout mounted across client navigations, so the admin layout decides the role once per visit; a page that does not call requireSuperAdminPage() first keeps serving a super admin demoted or deleted after that (CACHE.2: an authorisation decision is never cached). The count is the number of pages under app/admin/(protected) whose default export does not start with the guard.',
  approximates: "a text reading: the first statement after the default export's opening brace is `await requireSuperAdminPage()`; a page whose default export the reading cannot find counts too",
  axis: 'boundary-clarity',
  lossAt: 5,
  scan: (c) => {
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!/(^|\/)app\/admin\/\(protected\)\/.*page\.tsx$/.test(f)) continue
      scanned++
      const text = c.read(f)
      const m = text.match(/export default (?:async )?function\s*[A-Za-z_$]?[\w$]*\s*\(/)
      const fn = m && m.index !== undefined ? functionAt(text, m.index + m[0].length - 1) : null
      const first = fn ? fn.body.slice(1).trim().split('\n')[0].trim() : ''
      if (first !== 'await requireSuperAdminPage()' && !first.startsWith('const me = await requireSuperAdminPage()') && !first.startsWith('const user = await requireSuperAdminPage()'))
        findings.push({ path: f, line: m && m.index !== undefined ? lineAt(text, m.index) : 1, detail: fn ? `first statement is "${first.slice(0, 40)}"` : 'no default export function found' })
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'an admin page whose first statement is not the guard counts; an arrow default export counts too',
      files: {
        'app/admin/(protected)/a/page.tsx': "export default async function Page() {\n  const rows = await prisma.user.findMany()\n  await requireSuperAdminPage()\n  return rows.length\n}\n",
        'app/admin/(protected)/b/page.tsx': "const Page = async () => {\n  await requireSuperAdminPage()\n  return null\n}\nexport default Page\n",
      },
      expect: 2,
    },
    {
      name: 'a page that guards first, keeping or not the user it returns, is clean; a manager page is not read',
      files: {
        'app/admin/(protected)/a/page.tsx': "import { requireSuperAdminPage } from '@/lib/auth-guard'\n\nexport default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  await requireSuperAdminPage()\n  return null\n}\n",
        'app/admin/(protected)/b/page.tsx': "export default async function Page() {\n  const me = await requireSuperAdminPage()\n  return me.email\n}\n",
        'app/manager/(protected)/c/page.tsx': "export default async function Page() {\n  return null\n}\n",
      },
      expect: 0,
    },
  ],
}
