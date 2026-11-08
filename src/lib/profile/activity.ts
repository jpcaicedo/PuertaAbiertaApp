"use client";

import * as React from "react";
import { formatTimeRange } from "@/lib/agenda/format";
import { getZone, ofZone, ZONES_TODAY } from "@/lib/zones/data";
import { useZonesState } from "@/lib/zones/store";
import { agendaToday } from "@/lib/agenda/today";
import { myActivities, type MyActivity } from "./data";

/** Inscripciones reales de la agenda (leídas en el servidor). Sin proveedor = datos de ejemplo. */
const RealAgenda = React.createContext<MyActivity[] | null>(null);

export function MyAgendaProvider({ value, children }: { value: MyActivity[]; children: React.ReactNode }) {
  return React.createElement(RealAgenda.Provider, { value }, children);
}

/**
 * Actividad de P2 = mock base + reservas hechas en Zonas comunes (flujo 6).
 * Devuelve próximas (ordenadas por día) y anteriores.
 */
export function useMyActivity(todayOverride?: string) {
  const real = React.useContext(RealAgenda);
  const today = todayOverride ?? (real ? agendaToday() : ZONES_TODAY);
  const zones = useZonesState();

  // Con Supabase las reservas ya vienen en `real`.
  const fromZones: MyActivity[] = (real ? [] : zones.bookings).flatMap((b) => {
    const zone = getZone(b.zoneId);
    if (!zone) return [];
    const isTurn = zone.booking === "slots";
    return [
      {
        id: `zona-${b.zoneId}-${b.day}-${b.start}`,
        day: b.day,
        title: isTurn ? `Turno en ${zone.withArticle}` : `Reserva ${ofZone(zone)}`,
        detail: `De ${formatTimeRange(b.start, b.end)}`,
        status: b.status === "pending" ? "pending" : "confirmed",
        statusLabel:
          b.status === "pending"
            ? "En revisión de la administración"
            : isTurn
              ? "Turno confirmado"
              : "Reserva confirmada",
        href: `/zonas-comunes/${b.zoneId}`,
      } satisfies MyActivity,
    ];
  });

  const all = [...(real ?? myActivities), ...fromZones];
  const upcoming = all.filter((a) => a.status !== "past" && a.day >= today).sort((a, b) => a.day.localeCompare(b.day));
  const past = all.filter((a) => a.status === "past" || a.day < today).sort((a, b) => b.day.localeCompare(a.day));
  return { upcoming, past };
}

/** "2 próximas y 1 en revisión" (P1). */
export function activitySummary(upcoming: MyActivity[]) {
  const confirmed = upcoming.filter((a) => a.status === "confirmed").length;
  const pending = upcoming.filter((a) => a.status === "pending").length;
  const parts = [];
  if (confirmed) parts.push(`${confirmed} ${confirmed === 1 ? "próxima" : "próximas"}`);
  if (pending) parts.push(`${pending} en revisión`);
  return parts.length ? parts.join(" y ") : "No tienes nada apartado";
}
