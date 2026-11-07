import { formatLongDate, formatTimeRange } from "@/lib/agenda/format";
import { bookableDays, getZone, type ApprovalZone, type Slot } from "./data";

/**
 * Reserva en curso (Z3 → Z6), viaja en la URL:
 *   ?dia=2026-10-24&franja=18:00&tipo=privada&motivo=…&invitados=25
 */
export type ReservationType = "privada" | "comunidad";

export type Reservation = {
  zone: ApprovalZone;
  day: string;
  slot: Slot;
  type: ReservationType;
  reason: string;
  guests: number;
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function getApprovalZone(id: string) {
  const z = getZone(id);
  return z?.booking === "approval" ? z : undefined;
}

/** Día y franja válidos para la zona, o `null`. */
export function parseSlot(zone: ApprovalZone, sp: Params) {
  const day = one(sp.dia);
  const slot = zone.slots.find((s) => s.start === one(sp.franja));
  if (!bookableDays(zone).includes(day) || !slot) return null;
  return { day, slot };
}

export function parseReservation(zone: ApprovalZone, sp: Params): Reservation | null {
  const base = parseSlot(zone, sp);
  if (!base) return null;
  const guests = Number(one(sp.invitados));
  return {
    zone,
    ...base,
    type: one(sp.tipo) === "comunidad" ? "comunidad" : "privada",
    reason: one(sp.motivo),
    guests: Number.isFinite(guests) && guests > 0 ? Math.round(guests) : 0,
  };
}

export function reservationQuery(r: {
  day: string;
  slot: Slot;
  type?: ReservationType;
  reason?: string;
  guests?: number;
}) {
  const q = new URLSearchParams({ dia: r.day, franja: r.slot.start });
  if (r.type) q.set("tipo", r.type);
  if (r.reason) q.set("motivo", r.reason);
  if (r.guests) q.set("invitados", String(r.guests));
  return q.toString();
}

/** "Salón social · Sábado 24 de octubre · 6:00 p. m. a 10:00 p. m." */
export function slotSummary(zone: ApprovalZone, day: string, slot: Slot) {
  return `${zone.name} · ${formatLongDate(day)} · ${formatTimeRange(slot.start, slot.end)}`;
}

export const guestsLabel = (n: number) => `${n} ${n === 1 ? "invitado" : "invitados"}`;
