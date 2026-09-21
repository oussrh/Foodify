/**
 * The import graph, checked instead of described (CODE-5).
 *
 * The first five rules are the same on every repository. The rules under "the boundary map"
 * are the arrows of CLAUDE.md ("Boundary map") that must not exist, one rule each. A violation
 * that is there today goes into `.dependency-cruiser-known-violations.json`
 * (`pnpm exec depcruise <roots> --config .dependency-cruiser.cjs --baseline`), which the gate
 * passes with `--ignore-known` and which may only shrink - the tool's own per-finding debt,
 * the same principle as the ratchet's `debt`. It is empty.
 *
 * Run: `pnpm run graph` (package.json holds the roots: app components lib auth.ts proxy.ts;
 *      exit code = number of error-severity violations; the gate treats non-zero as red)
 * Graph: `pnpm run graph:mermaid > docs/graph.mmd`
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "A cycle means neither module can be understood, tested or deleted without the other; " +
        "invert the dependency or move the shared piece below both.",
      from: {},
      to: { circular: true, dependencyTypesNot: ["type-only"] },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment:
        "Nothing imports this module and it is not an entry point: dead (CODE-6), or an entry " +
        "point this config does not know - add it to `pathNot` with the reason.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$", // dot files
          "[.]d[.]ts$", // declaration files
          "(^|/)tsconfig[.]json$",
          "(^|/)(?:babel|webpack|vite|vitest|next|playwright|drizzle|eslint|prettier)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$",
          "(^|/)(?:app|pages)/.*(?:page|layout|route|loading|error|not-found|template|default|middleware|proxy|instrumentation)[.](?:js|jsx|ts|tsx)$", // framework entry points
          "^(?:src/)?(?:proxy|middleware|instrumentation(?:-client)?)[.](?:js|ts)$", // Next root-level entry points, run by the framework
          "(^|/)scripts/", // run by name, not imported
        ],
      },
      to: {},
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "An import that resolves to nothing fails at runtime or in the build, never in the editor.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment:
        "Production code importing a devDependency works on the developer's machine and fails in " +
        "the image; a test helper is the usual culprit.",
      from: { path: "^(src|app|components|server|lib|packages/[^/]+/src)/", pathNot: "[.](?:spec|test|stories)[.](?:js|mjs|cjs|jsx|ts|tsx)$|(^|/)(?:tests?|e2e|__tests__|fixtures)/" },
      to: { dependencyTypes: ["npm-dev"], dependencyTypesNot: ["type-only"], pathNot: ["node_modules/@types/"] },
    },
    {
      name: "no-duplicate-dep-types",
      severity: "warn",
      comment: "A package listed under two dependency kinds is installed by the wrong one somewhere.",
      from: {},
      to: { moreThanOneDependencyType: true, dependencyTypesNot: ["type-only"] },
    },

    // ---- the boundary map: one rule per arrow that must not exist (CLAUDE.md, "Boundary map") --
    // Direction: lib -> components -> app. lib knows nothing above it; a component reaches app/
    // only for a server action; server code renders nothing; a module holding a secret or the
    // database client is imported by server code only; the two portals share through
    // components/shell and components/forms, never each other.
    {
      name: "data-layer-is-a-leaf",
      severity: "error",
      comment: "lib/ is the shared layer: it knows nothing of routes or components (boundary map, row `lib`).",
      from: { path: "^lib/" },
      to: { path: "^(?:app|components)/" },
    },
    {
      name: "components-never-import-routes",
      severity: "error",
      comment: "A component may import a server action (app/actions); a page, a layout, a route handler or a route's helper is composed by app/, never imported by it (boundary map, row `components`).",
      from: { path: "^components/" },
      to: { path: "^app/", pathNot: "^app/actions/" },
    },
    {
      name: "server-code-never-imports-components",
      severity: "error",
      comment: "A server action or a route handler answers data, never markup: nothing under app/actions or app/api imports a component (boundary map, row `app/actions`, `app/api`).",
      from: { path: "^app/(?:actions|api)/" },
      to: { path: "^components/" },
    },
    {
      name: "server-only-never-reaches-the-client",
      severity: "error",
      comment: "The database client, the mailer, the Cloudinary signer, and every lib module that reaches one of them (the guards, the sign-in checks, the OTP request, the menu loader: the transitive closure, recomputed when a lib module starts importing one) hold a secret or a connection: a component reaches them through a server action only (CODE-10, SEC-1). lib/env is shared on purpose (publicEnv) and is not listed.",
      from: { path: "^components/" },
      to: { path: "^(?:lib/(?:prisma|mail|cloudinary|auth-guard|otp-request|sign-in-checks|menu-loader)|auth)(?:[.]ts|/)" },
    },
    {
      name: "portals-never-import-each-other",
      severity: "error",
      comment: "components/admin and components/manager are the two portals' sections; what both need lives in components/shell or components/forms (boundary map).",
      from: { path: "^components/(admin|manager)/" },
      to: { path: "^components/(admin|manager)/", pathNot: "^components/$1/" },
    },
  ],
  options: {
    doNotFollow: { path: ["node_modules"] },
    exclude: { path: ["node_modules", "(^|/)(?:dist|build|coverage|[.]next|[.]turbo)/"] },
    // Pre-compilation dependencies are cruised (faster on TypeScript, and it is what lets an
    // `import type` be recorded as `type-only`, which `no-circular` and `not-to-dev-dep` then
    // exclude: a type cycle is harmless at runtime, a type from a dev dependency is fine).
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
    cache: true,
    reporterOptions: {
      dot: { collapsePattern: "node_modules/(?:@[^/]+/[^/]+|[^/]+)" },
      text: { highlightFocused: true },
    },
  },
};
