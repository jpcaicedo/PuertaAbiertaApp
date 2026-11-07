"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado del usuario en la Agenda (mock en el navegador).
 * TODO: reemplazar por llamadas a la API:
 *   POST   /api/actividades/:id/inscripcion
 *   DELETE /api/actividades/:id/inscripcion
 *   POST   /api/actividades/:id/lista-espera
 *   POST   /api/eventos-barrio/:id/voy
 */
type AgendaState = {
  enrolled: string[];
  /** id → puesto en la lista de espera */
  waitlist: Record<string, number>;
  going: string[];
};

const KEY = "pa.agenda";
const empty: AgendaState = { enrolled: [], waitlist: {}, going: [] };
let state: AgendaState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {
    /* almacenamiento no disponible: seguimos en memoria */
  }
}

function set(next: AgendaState) {
  state = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAgendaState() {
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => empty,
  );
}

export const agendaActions = {
  enroll(id: string) {
    load();
    if (!state.enrolled.includes(id)) set({ ...state, enrolled: [...state.enrolled, id] });
  },
  cancel(id: string) {
    load();
    set({ ...state, enrolled: state.enrolled.filter((x) => x !== id) });
  },
  /** Devuelve el puesto asignado en la lista de espera. */
  joinWaitlist(id: string) {
    load();
    // Mock: ya hay 2 personas esperando antes que tú.
    const position = state.waitlist[id] ?? 3;
    set({ ...state, waitlist: { ...state.waitlist, [id]: position } });
    return position;
  },
  toggleGoing(id: string) {
    load();
    const going = state.going.includes(id) ? state.going.filter((x) => x !== id) : [...state.going, id];
    set({ ...state, going });
  },
};
