import { twMerge } from 'tailwind-merge'

export function cn(...parts: Array<string | false | undefined | null>): string {
  return twMerge(...(parts.filter(Boolean) as string[]))
}
