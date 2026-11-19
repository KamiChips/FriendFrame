import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// une clases de tailwind resolviendo conflictos: cn("px-2", cond && "px-4") -> "px-4"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
