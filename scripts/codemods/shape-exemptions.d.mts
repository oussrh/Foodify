export const EXEMPTIONS_FILE: string
export const SHAPE_RULES: string[]
export function readExemptions(file?: string): string[]
export function failingFiles(results: { filePath: string; messages: { ruleId: string | null }[] }[], root: string): string[]
export function checkExemptions(listed: string[], failing: string[], exists: (f: string) => boolean): { stale: string[]; missing: string[] }
