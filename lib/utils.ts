// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn's class joiner: clsx for the conditionals, then tailwind-merge so a caller's `p-4` wins over a component's `p-2` instead of both applying. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
