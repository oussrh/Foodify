// Types for the codemod's export, so its test type-checks (plain ESM run by node, no build).
export function removeUnusedImports(
  text: string,
  marks: Set<string>,
  fileName?: string,
): { text: string; removed: number; statements: number }
