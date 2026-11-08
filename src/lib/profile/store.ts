"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { notifications, type NotifyKey, type PrivacyKey } from "./data";
import { saveNotify, savePrivacy } from "./actions";

/**
 * Preferencias de privacidad y notificaciones, y notificaciones leídas (mock en sessionStorage).
 * TODO: reemplazar por la API (ver data.ts).
 */

type State = {
  privacy: Record<PrivacyKey, boolean>;
  notify: Record<NotifyKey, boolean>;
  read: string[];
};

const KEY = "pa.perfil";
const initial = (): State => ({
  // Por defecto solo se ve el nombre y la torre (P3).
  privacy: { showApartment: false, showPhone: false, inDirectory: true, acceptMessages: true },
  notify: { requests: true, agenda: true, messages: true, marketplace: false },
  read: [],
});

let state: State = initial();
let loaded = false;
/** true cuando las preferencias vienen de Supabase: se guardan allá y no en el navegador. */
let remote = false;
let hydratedFrom: Prefs | null = null;

type Prefs = Pick<State, "privacy" | "notify">;
const ServerPrefs = React.createContext<Prefs | null>(null);

/** Entrega las preferencias guardadas en Supabase (las lee el layout raíz con el usuario). */
export function ProfilePrefsProvider({ value, children }: { value: Prefs; children: React.ReactNode }) {
  if (typeof window !== "undefined" && hydratedFrom !== value) {
    load();
    hydratedFrom = value;
    remote = true;
    state = { ...state, privacy: value.privacy, notify: value.notify };
  }
  React.useEffect(() => {
    listeners.forEach((l) => l());
  }, [value]);
  return React.createElement(ServerPrefs.Provider, { value }, children);
}
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
    // Con Supabase solo se guarda en el navegador lo que no es preferencia (notificaciones leídas).
    window.sessionStorage.setItem(KEY, JSON.stringify(remote ? { read: state.read } : state));
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l());
}

export function useProfileState() {
  const server = React.useContext(ServerPrefs);
  const serverState = React.useMemo(() => (server ? { ...serverSnapshot, ...server } : serverSnapshot), [server]);
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (load(), state),
    () => serverState,
  );
}

export const isUnread = (s: State, id: string) =>
  !s.read.includes(id) && (notifications.find((n) => n.id === id)?.unread ?? false);

export const profileActions = {
  setPrivacy(key: PrivacyKey, value: boolean) {
    load();
    set({ ...state, privacy: { ...state.privacy, [key]: value } });
    if (remote) void savePrivacy(key, value);
  },
  setNotify(key: NotifyKey, value: boolean) {
    load();
    const notify = { ...state.notify, [key]: value };
    set({ ...state, notify });
    if (remote) void saveNotify(notify);
  },
  markRead(id: string) {
    load();
    if (!state.read.includes(id)) set({ ...state, read: [...state.read, id] });
  },
};
