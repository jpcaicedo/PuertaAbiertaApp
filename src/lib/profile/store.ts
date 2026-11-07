"use client";

import { useSyncExternalStore } from "react";
import { notifications, type NotifyKey, type PrivacyKey } from "./data";

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

export function useProfileState() {
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

export const isUnread = (s: State, id: string) =>
  !s.read.includes(id) && (notifications.find((n) => n.id === id)?.unread ?? false);

export const profileActions = {
  setPrivacy(key: PrivacyKey, value: boolean) {
    load();
    set({ ...state, privacy: { ...state.privacy, [key]: value } });
  },
  setNotify(key: NotifyKey, value: boolean) {
    load();
    set({ ...state, notify: { ...state.notify, [key]: value } });
  },
  markRead(id: string) {
    load();
    if (!state.read.includes(id)) set({ ...state, read: [...state.read, id] });
  },
};
