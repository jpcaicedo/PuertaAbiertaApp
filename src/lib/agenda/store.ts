"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { cancelEnrollment, enrollActivity, setGoing } from "./actions";

/**
 * Estado del usuario en la Agenda: inscrito, lista de espera y "voy".
 * · Con Supabase: llega del servidor (<AgendaStateProvider>) y los cambios se guardan con server actions.
 *   La pantalla cambia al instante y se corrige sola cuando responde el servidor.
 * · Modo demo: vive en sessionStorage, como en el prototipo.
 */
export type AgendaState = {
  /** slugs */
  enrolled: string[];
  /** slug → puesto en la lista de espera */
  waitlist: Record<string, number>;
  going: string[];
};

/** Lo mínimo de una actividad que necesitan las acciones. */
type Target = { id: string; dbId?: string };

const KEY = "pa.agenda";
const empty: AgendaState = { enrolled: [], waitlist: {}, going: [] };
let state: AgendaState = empty;
let loaded = false;
/** true cuando el estado viene del servidor: no se lee ni se escribe sessionStorage. */
let remote = false;
let hydratedFrom: AgendaState | null = null;
const listeners = new Set<() => void>();

const ServerState = React.createContext<AgendaState | null>(null);

/** Entrega al cliente lo que el usuario tiene en la agenda (leído en el servidor). */
export function AgendaStateProvider({ value, children }: { value: AgendaState; children: React.ReactNode }) {
  // Se sincroniza en el render para que la primera pintura ya muestre "Ya estás inscrita".
  if (typeof window !== "undefined" && hydratedFrom !== value) {
    hydratedFrom = value;
    remote = true;
    loaded = true;
    state = value;
  }
  React.useEffect(() => {
    listeners.forEach((l) => l());
  }, [value]);
  return React.createElement(ServerState.Provider, { value }, children);
}

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
  if (!remote) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAgendaState() {
  const server = React.useContext(ServerState);
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => server ?? empty,
  );
}

const without = <T,>(list: T[], x: T) => list.filter((y) => y !== x);
const withoutKey = (rec: Record<string, number>, k: string) => {
  const { [k]: _omit, ...rest } = rec;
  void _omit;
  return rest;
};

export const agendaActions = {
  enroll(item: Target) {
    load();
    if (!state.enrolled.includes(item.id)) set({ ...state, enrolled: [...state.enrolled, item.id] });
    if (item.dbId) {
      void enrollActivity(item.dbId).then((r) => {
        // No se pudo (por ejemplo, ya empezó): se deshace el cambio en pantalla.
        if (!r.ok) {
          set({ ...state, enrolled: without(state.enrolled, item.id) });
          return;
        }
        // Si alguien tomó el último cupo antes, el servidor lo deja en lista de espera.
        if (r.ok && r.status === "espera" && r.position) {
          set({
            ...state,
            enrolled: without(state.enrolled, item.id),
            waitlist: { ...state.waitlist, [item.id]: r.position },
          });
        }
      });
    }
  },
  cancel(item: Target) {
    load();
    set({ ...state, enrolled: without(state.enrolled, item.id), waitlist: withoutKey(state.waitlist, item.id) });
    if (item.dbId) void cancelEnrollment(item.dbId);
  },
  /** Devuelve el puesto asignado en la lista de espera. */
  async joinWaitlist(item: Target): Promise<number> {
    load();
    let position = state.waitlist[item.id] ?? 3; // demo: ya hay 2 personas antes
    if (item.dbId) {
      const r = await enrollActivity(item.dbId);
      if (r.ok && r.status === "inscrito") {
        // Se liberó un cupo mientras tanto.
        set({ ...state, enrolled: [...without(state.enrolled, item.id), item.id] });
        return 0;
      }
      position = r.ok && r.position ? r.position : 1;
    }
    set({ ...state, waitlist: { ...state.waitlist, [item.id]: position } });
    return position;
  },
  toggleGoing(item: Target) {
    load();
    const isGoing = state.going.includes(item.id);
    set({ ...state, going: isGoing ? without(state.going, item.id) : [...state.going, item.id] });
    if (item.dbId) void setGoing(item.dbId, !isGoing);
  },
};
