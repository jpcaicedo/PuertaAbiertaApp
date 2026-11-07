"use client";

import { useSyncExternalStore } from "react";
import type { AdminNotice } from "./data";

/** Decisiones de la administración (mock en sessionStorage). TODO: API (ver data.ts). */

export type Decision = "approved" | "rejected" | "proposed";

type State = {
  decisions: Record<string, Decision>;
  notices: AdminNotice[];
  reports: Record<string, "removed" | "kept">;
};

const KEY = "pa.admin";
const initial = (): State => ({ decisions: {}, notices: [], reports: {} });

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

export function useAdminState() {
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

export const adminActions = {
  decide(id: string, decision: Decision) {
    load();
    set({ ...state, decisions: { ...state.decisions, [id]: decision } });
  },
  publish(notice: AdminNotice) {
    load();
    set({ ...state, notices: [notice, ...state.notices] });
  },
  resolveReport(id: string, result: "removed" | "kept") {
    load();
    set({ ...state, reports: { ...state.reports, [id]: result } });
  },
};
