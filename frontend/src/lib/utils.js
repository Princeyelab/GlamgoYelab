import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with conditional logic
 * Combines clsx for conditional classes and twMerge to avoid class conflicts
 *
 * @param {...any} inputs - Class names (strings, objects, arrays)
 * @returns {string} Merged class names
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary", className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
