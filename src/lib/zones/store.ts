"use client";

import { useSyncExternalStore } from "react";

/**
 * Reservas propias (mock en sessionStorage).
 * TODO: reemplazar por la API:
 *   POST   /api/zonas/:id/reservas   { dia, inicio, fin, tipo, motivo, invitados }
 *   GET    /api/usuarios/me/reservas
 *   DELETE /api/reservas/:id
 */

export type MyBooking = {
  zoneId: string;
  day: string;
  start: string;
  end: string;
  status: "pending" | "confirmed";
  guests?: number;
};

type State = { bookings: MyBooking[] };

const KEY = "pa.zonas";
const initial = (): State => ({ bookings: [] });

let state: State = initial();
let loaded = false;
const listeners = new Set<() => void>();
const serverSnapshot = initial();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {
    /* seguimos en memoria */
  }
}

function set(next: State) {
  state = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l());
}

export function useZonesState() {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (load(), state),
    () => serverSnapshot,
  );
}

const same = (a: MyBooking, b: Pick<MyBooking, "zoneId" | "day" | "start">) =>
  a.zoneId === b.zoneId && a.day === b.day && a.start === b.start;

export const findBooking = (s: State, zoneId: string, day: string, start: string) =>
  s.bookings.find((b) => same(b, { zoneId, day, start }));

export const zonesActions = {
  /** Crea o actualiza la reserva (idempotente por zona + día + inicio). */
  save(booking: MyBooking) {
    load();
    set({
      bookings: [booking, ...state.bookings.filter((b) => !same(b, booking))],
    });
  },
  cancel(zoneId: string, day: string, start: string) {
    load();
    set({
      bookings: state.bookings.filter((b) => !same(b, { zoneId, day, start })),
    });
  },
};
