// eslint.config.mjs (ESLint flat config; `next lint` is gone in Next 16)
// Next's core-web-vitals and TypeScript presets over the whole tree, minus build output, the
// service worker (a plain script Next never bundles), the harness and vendored patches.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'generated/**', 'public/**', '.claude/**', '.abatty/**', 'patches/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
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
