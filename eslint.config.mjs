// eslint.config.mjs (ESLint flat config; `next lint` is gone in Next 16)
// Next's core-web-vitals and TypeScript presets over the whole tree, minus build output, the
// service worker (a plain script Next never bundles), the harness and vendored patches.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'generated/**', 'public/**', '.claude/**', '.abatty/**', 'patches/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  { rules: { 'no-debugger': 'error' } },
  {
    // The presets scope their plugins to these extensions (no .cjs); overrides must match.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // The Next 16 presets are stricter than 15's core-web-vitals (typescript-eslint, and the
      // React Compiler rules of react-hooks 7). What they flagged in the tree on 2026-09-20 is
      // held at warn here (95 unused vars, 12 `any` also counted by the ratchet's types.escapes,
      // 20 compiler findings) and driven to zero by phase 1 (lint) and phase 9 (types), never
      // silenced per line. Nothing is off.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]
