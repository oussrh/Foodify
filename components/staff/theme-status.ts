// components/staff/theme-status.ts
// How the device sheet words a staff screen's theme. next-themes hands back the stored choice
// (`theme`: light, dark or system) and what it comes to now (`resolvedTheme`); before either is
// known — the server render, or a device that never chose — the staff default is light.

/** The status line for a stored theme choice and what it resolves to right now. */
export function themeStatus(theme: string | undefined, resolved: string | undefined): string {
  if (theme === 'system') return `Following the device: ${resolved === 'dark' ? 'dark' : 'light'} right now`
  return theme === 'dark' ? 'Dark' : 'Light'
}
