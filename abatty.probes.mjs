// abatty.probes.mjs
// The repository's own ratchet probes (abatty.config.json → ratchet.local), one module each
// under abatty-probes/. Each proves itself on its control cases: `pnpm exec abatty ratchet
// --controls`. They are text probes, a proxy for the rule, and say so in their `approximates`.
import { bareResponse, floatMoney, rowReturn, unboundedList } from './abatty-probes/api.mjs'
import { unguardedAdminPage } from './abatty-probes/auth.mjs'
import { unparsedBoundary } from './abatty-probes/boundary.mjs'
import { serverCacheUse } from './abatty-probes/cache.mjs'
import { dupClonedLines, dupClones } from './abatty-probes/dup.mjs'
import { wholeEnv } from './abatty-probes/env.mjs'
import { shapeExemptions } from './abatty-probes/shape.mjs'

/** @type {import("abatty").Probe[]} */
export const probes = [unparsedBoundary, wholeEnv, serverCacheUse, unguardedAdminPage, bareResponse, unboundedList, rowReturn, floatMoney, shapeExemptions, dupClones, dupClonedLines]
