import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length ? parts[parts.length - 1].slice(0, 1).toUpperCase() : "?"
}
