// eslint.config.mjs (ESLint flat config; `next lint` is gone in Next 16)
// Next's core-web-vitals and TypeScript presets over the whole tree, minus build output, the
// service worker (a plain script Next never bundles), the harness and vendored patches.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'generated/**', 'public/**', '.claude/**', '.abatty/**', 'patches/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Accessibility (A11Y-LINT, phase 3): the plugin's recommended set at error, over the whole
    // markup, with the primitives in components/ui mapped to the element they render so
    // <Button>, <Input> and <Link> are checked as button, input and a. Next's preset runs six of
    // these rules at warn without the mapping, which reports nothing on code that fails. Radix's
    // asChild hands the element to the child, so the accessible name goes on the child.
    // The preset registers the plugin; a second instance under the same name is refused, so only
    // the recommended rules are taken from it.
    files: ['**/*.{jsx,tsx}'],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // `role="admin" | "manager"` is this app's portal prop on five of its own components, not an
      // ARIA role; DOM elements and the mapped primitives above stay checked. Renaming the prop
      // (17 files, a codemod) is recorded as deferred in docs/ADOPTION_DECISIONS.md.
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
      // Radix's Switch and Checkbox render a button, a labelable element the rule does not list.
      'jsx-a11y/label-has-associated-control': ['error', { controlComponents: ['Switch', 'Checkbox'] }],
    },
    settings: {
      'jsx-a11y': {
        components: {
          Button: 'button',
          Input: 'input',
          Textarea: 'textarea',
          Label: 'label',
          Link: 'a',
          Image: 'img',
          Badge: 'div',
          Card: 'div',
          CardHeader: 'div',
          CardContent: 'div',
          CardFooter: 'div',
          CardTitle: 'h3',
          CardDescription: 'p',
          Table: 'table',
          TableHeader: 'thead',
          TableBody: 'tbody',
          TableRow: 'tr',
          TableHead: 'th',
          TableCell: 'td',
        },
        polymorphicPropName: 'as',
      },
    },
  },
  { rules: { 'no-debugger': 'error' } },
  {
    // The presets scope their plugins to these extensions (no .cjs); overrides must match.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // Phase 1 (2026-09-20) took the tree to zero warnings; every preset rule runs at its own
      // level and the lint script holds --max-warnings=0. Nothing is off, nothing is held down.
    },
  },
]

export default config
