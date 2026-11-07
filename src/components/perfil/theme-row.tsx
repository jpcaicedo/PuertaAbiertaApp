"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RowIcon } from "./ui";

const subscribe = () => () => {};

/**
 * Fila "Modo oscuro" de P1 · Configuración: icono, etiqueta e interruptor 48×28.
 * El tema real solo se conoce en el navegador, así que hasta montar se pinta apagado
 * (evita diferencias entre el HTML del servidor y el del cliente).
 */
export function ThemeRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";

  return (
    <li className="flex w-full items-center gap-3.5 px-4 py-3.5">
      <RowIcon icon={dark ? Moon : Sun} tone="neutral" />
      <span id="modo-oscuro-label" className="min-w-0 flex-1 text-callout font-semibold text-text">
        Modo oscuro
      </span>
      <Switch
        size="lg"
        checked={dark}
        disabled={!mounted}
        onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
        aria-labelledby="modo-oscuro-label"
      />
    </li>
  );
}
