"use client";

import { useSyncExternalStore } from "react";
import { demoPqrs, pqrsNumber, type Pqrs, type PqrsStatus } from "./data";
import type { PqrsInput } from "./actions";

/** Modo demo (sin Supabase): los reportes nuevos y los cambios de estado quedan en el navegador. */

type State = { created: Pqrs[]; updates: Record<string, Pqrs["events"]> };

const KEY = "pa.pqrs";
const initial = (): State => ({ created: [], updates: {} });

let state: State = initial();
let loaded = false;
const listeners = new Set<() => void>();
const serverSnapshot = initial();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = { ...initial(), ...JSON.parse(raw) };
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

function usePqrsState() {
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

const withUpdates = (p: Pqrs, s: State): Pqrs => {
  const extra = s.updates[p.id];
  if (!extra?.length) return p;
  const last = extra[extra.length - 1];
  return { ...p, events: [...p.events, ...extra], status: last.status, updatedAt: last.at };
};

const noop = () => () => {};

/**
 * Todos los reportes del modo demo: los creados en el navegador primero.
 * `undefined` hasta que carga en el navegador (las fechas de ejemplo dependen de la hora actual).
 */
export function useDemoPqrs(): Pqrs[] | undefined {
  const s = usePqrsState();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) return undefined;
  return [...s.created, ...demoPqrs()].map((p) => withUpdates(p, s));
}

export const pqrsDemoActions = {
  create(input: PqrsInput & { photoPreview?: string }): string {
    load();
    const now = new Date().toISOString();
    const id = `demo-${Date.now()}`;
    const item: Pqrs = {
      id,
      number: pqrsNumber(13 + state.created.length),
      kind: input.kind,
      title: input.title.trim(),
      place: input.place.trim() || undefined,
      description: input.description.trim(),
      photo: input.photoPreview,
      status: "recibido",
      createdAt: now,
      updatedAt: now,
      by: { name: "Sandra", unit: "Torre E, apto 204" },
      events: [{ status: "recibido", at: now }],
    };
    set({ ...state, created: [item, ...state.created] });
    return id;
  },
  update(id: string, status: PqrsStatus, note: string) {
    load();
    const event = { status, note: note.trim() || undefined, at: new Date().toISOString() };
    set({ ...state, updates: { ...state.updates, [id]: [...(state.updates[id] ?? []), event] } });
  },
};
