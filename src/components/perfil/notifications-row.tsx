"use client";

import Link from "next/link";
import { Bell, BellOff, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { profileActions, useProfileState } from "@/lib/profile/store";
import { RowIcon } from "./ui";

/**
 * Fila "Notificaciones" de P1 · Configuración: interruptor general (prendido por defecto)
 * y enlace para elegir cuáles llegan. Apagado, no llega ninguna, ni el aviso flotante.
 */
export function NotificationsRow() {
  const { notify } = useProfileState();
  const on = notify.all !== false;

  return (
    <li className="flex w-full items-center gap-3.5 pr-4">
      <Link
        href="/perfil/notificaciones"
        className="flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pl-4 text-left transition-colors hover:bg-surface-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <RowIcon icon={on ? Bell : BellOff} tone="neutral" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span id="notificaciones-label" className="text-callout font-semibold text-text">
            Notificaciones
          </span>
          <span className="text-label text-text-tertiary">{on ? "Elige qué te avisamos" : "Apagadas: no te avisamos nada"}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
      </Link>
      <Switch
        size="lg"
        checked={on}
        onCheckedChange={(v) => profileActions.setNotify("all", v)}
        aria-labelledby="notificaciones-label"
      />
    </li>
  );
}
