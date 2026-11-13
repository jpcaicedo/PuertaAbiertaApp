"use client";

import { useSyncExternalStore } from "react";

/**
 * Desde qué pestaña se entró a Zonas comunes: Inicio o Agenda ("Reservar un espacio").
 * Decide qué pestaña queda activa en la barra inferior y a dónde vuelve la flecha de la lista.
 * Se guarda en la pestaña del navegador (sessionStorage) y cambia al visitar Inicio o Agenda.
 */
export type ZonesOrigin = "inicio" | "agenda";

const KEY = "pa.zonas.desde";
const listeners = new Set<() => void>();

function read(): ZonesOrigin {
  try {
    return window.sessionStorage.getItem(KEY) === "agenda" ? "agenda" : "inicio";
  } catch {
    return "inicio";
  }
}

export function setZonesOrigin(origin: ZonesOrigin) {
  try {
    if (window.sessionStorage.getItem(KEY) === origin) return;
    window.sessionStorage.setItem(KEY, origin);
  } catch {
    /* sin almacenamiento: queda Inicio */
  }
  listeners.forEach((l) => l());
}

export function useZonesOrigin(): ZonesOrigin {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "inicio",
  );
}
