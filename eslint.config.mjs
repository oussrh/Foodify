// eslint.config.mjs (ESLint flat config; `next lint` is gone in Next 16)
// Next's core-web-vitals and TypeScript presets over the whole tree, minus build output, the
// service worker (a plain script Next never bundles), the harness and vendored patches.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import jsdoc from 'eslint-plugin-jsdoc'
import { readExemptions } from './scripts/codemods/shape-exemptions.mjs'
import { COMPONENT_LINES, SHAPE_RULE_CONFIG } from './scripts/codemods/shape-exemptions.mjs'

// Function shape (CODE-SHAPE, phase 7): the standard's thresholds at error over the whole tree,
// off only for the files scripts/ci/shape-exemptions.json lists. That list is generated from the
// findings (scripts/codemods/shape-exemptions.mjs --write), checked by the lint script (--check:
// a listed file that passes is an error) and counted by the ratchet (fn.shapeExemptions), so it
// can only shrink. A new failure anywhere else is a lint error the moment it is written.
// A path is a literal here, so the glob characters a route segment carries ([id], (protected)) are escaped.
const shapeExemptions = readExemptions().map((p) => p.replace(/[[\]()]/g, (ch) => `\\${ch}`))

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
    // JSDoc on the boundary surface (CODE.7, phase 11): every export of the shared layer, the
    // server actions, the route handlers and the two auth modules carries a block that says
    // what a reader would get wrong; types stay in TypeScript (no-types). Components are read
    // by their props and their markup, not held by this rule.
    files: ['lib/**/*.ts', 'app/actions/**/*.ts', 'app/api/**/*.ts', 'auth.ts', 'proxy.ts'],
    ignores: ['**/*.test.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, FunctionExpression: false, ArrowFunctionExpression: false, ClassDeclaration: true, MethodDefinition: false },
          contexts: ['ExportNamedDeclaration > VariableDeclaration > VariableDeclarator', 'ExportNamedDeclaration > TSTypeAliasDeclaration', 'ExportNamedDeclaration > TSInterfaceDeclaration'],
        },
      ],
      'jsdoc/no-types': 'error',
    },
  },
  { files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'], rules: SHAPE_RULE_CONFIG },
  { files: ['**/*.tsx'], rules: { 'max-lines-per-function': COMPONENT_LINES } },
  // Tests and fixtures describe a behaviour per block, not a function per concern; a spec's
  // describe body is one long arrow by design.
  { files: ['**/*.test.{ts,tsx}', 'e2e/**'], rules: { 'max-lines-per-function': 'off' } },
  ...(shapeExemptions.length ? [{ files: shapeExemptions, rules: { 'max-lines': 'off', 'max-lines-per-function': 'off', complexity: 'off', 'max-params': 'off' } }] : []),
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
