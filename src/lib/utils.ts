import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge necesita conocer la escala tipográfica custom; si no,
 * confunde `text-caption` (tamaño) con un color y lo descarta al fusionar.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "heading", "body", "label", "caption", "overline"] }],
      shadow: [{ shadow: ["button"] }],
      rounded: [{ rounded: ["field", "chip", "card", "panel", "sheet"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
