import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAdminKey() {
  return `org_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
}