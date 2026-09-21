import { describe, expect, it } from 'vitest'
import { renameCallSite, renameDeclaring } from './rename-portal-prop.mjs'

describe('renamePortalProp', () => {
  it('renames the portal value at a call site and leaves ARIA roles alone', () => {
    const src = `<AppShell role="admin" user={u}>\n  <p role="alert">x</p>\n  <RestaurantRowMenu role={role} slug={s} />\n</AppShell>\n`
    expect(renameCallSite(src)).toBe(`<AppShell portal="admin" user={u}>\n  <p role="alert">x</p>\n  <RestaurantRowMenu portal={portal} slug={s} />\n</AppShell>\n`)
  })

  it('renames the prop through a declaring component: type, destructuring, expressions, JSX; not the signIn key nor an ARIA attribute', () => {
    const src = `interface P {\n  role: ShellRole\n}\nexport default function Shell({ role, user }: P) {\n  const nav = NAV[role]\n  const href = \`/\${role}/x\`\n  if (role === 'admin') go()\n  await signIn('credentials', { email, role: cfg.authRole })\n  return <div role="navigation"><UserMenu role={role} /></div>\n}\n`
    expect(renameDeclaring(src)).toBe(`interface P {\n  portal: ShellRole\n}\nexport default function Shell({ portal, user }: P) {\n  const nav = NAV[portal]\n  const href = \`/\${portal}/x\`\n  if (portal === 'admin') go()\n  await signIn('credentials', { email, role: cfg.authRole })\n  return <div role="navigation"><UserMenu portal={portal} /></div>\n}\n`)
  })
})
