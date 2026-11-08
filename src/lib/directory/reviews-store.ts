"use client";

import { useSyncExternalStore } from "react";

/** Modo demo (sin Supabase): mi reseña de cada servicio queda en el navegador. */

export type MyReview = { stars: number; text: string; date: string };
type State = Record<string, MyReview>;

const KEY = "pa.resenas";
let state: State = {};
let loaded = false;
const listeners = new Set<() => void>();
const serverSnapshot: State = {};

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

/** Mi reseña de ejemplo para un servicio (undefined en el servidor y si no hay). */
export function useDemoReview(slug: string): MyReview | undefined {
  const s = useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (load(), state),
    () => serverSnapshot,
  );
  return s[slug];
}

export const demoReviewActions = {
  save(slug: string, stars: number, text: string) {
    load();
    set({ ...state, [slug]: { stars, text: text.trim(), date: new Date().toISOString() } });
  },
  remove(slug: string) {
    load();
    const next = { ...state };
    delete next[slug];
    set(next);
  },
};
