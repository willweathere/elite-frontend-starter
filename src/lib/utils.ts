import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (resolves conflicts, dedupes).
 * This is the helper shadcn/ui components rely on.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
