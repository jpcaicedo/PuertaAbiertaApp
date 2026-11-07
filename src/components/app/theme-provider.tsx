"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Tema claro / oscuro.
 * - Pone `class="dark"` en <html> (ver `@custom-variant dark` en globals.css).
 * - Por defecto sigue `prefers-color-scheme` del sistema.
 * - Si el vecino lo cambia en Perfil, se guarda en localStorage (`pa-theme`).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="pa-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
