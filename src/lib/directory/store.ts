"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import type { ProductCategory, ProductCondition } from "./data";
import { deleteProduct, markProductSold } from "./actions";

/**
 * Publicaciones propias y borrador de servicio (mock en sessionStorage).
 * TODO: reemplazar por la API:
 *   POST  /api/servicios            · POST  /api/productos
 *   GET   /api/usuarios/me/publicaciones
 *   PATCH /api/productos/:id  { estado: "vendido" }
 *   POST  /api/productos/:id/reportes
 */

export type MyListing = {
  id: string;
  title: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  /** ISO */
  publishedAt: string;
  soldAt?: string;
  messages: number;
  /** Con Supabase: primera foto, id en la base de datos y si la administración lo retiró. */
  image?: string;
  dbId?: string;
  removed?: boolean;
};

export type ServiceDraft = {
  category: string;
  title: string;
  description: string;
  price: string;
  availability: string;
  showApartment: boolean;
  acceptCalls: boolean;
  /** Celular, solo si acepta llamadas. */
  phone?: string;
};

type State = { listings: MyListing[]; serviceDraft: ServiceDraft | null };

const KEY = "pa.directorio";
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

const initial = (): State => ({
  listings: [
    {
      id: "silla-ergonomica",
      title: "Silla de escritorio ergonómica",
      price: 150000,
      category: "hogar",
      condition: "como-nuevo",
      publishedAt: minutesAgo(5),
      messages: 3,
    },
    {
      id: "carrito-mercado",
      title: "Carrito de mercado plegable",
      price: 45000,
      category: "hogar",
      condition: "usado",
      publishedAt: "2026-10-28T15:00:00",
      soldAt: "2026-11-02T10:00:00",
      messages: 2,
    },
  ],
  serviceDraft: null,
});

let state: State = initial();
let loaded = false;
/** true cuando las publicaciones vienen de Supabase. */
let remote = false;
let hydratedFrom: MyListing[] | null = null;
const ServerListings = React.createContext<MyListing[] | null>(null);

/** Entrega las publicaciones propias leídas en el servidor (Mis publicaciones, Marketplace, Perfil). */
export function DirectoryListingsProvider({ value, children }: { value: MyListing[]; children: React.ReactNode }) {
  if (typeof window !== "undefined" && hydratedFrom !== value) {
    load();
    hydratedFrom = value;
    remote = true;
    state = { ...state, listings: value };
  }
  React.useEffect(() => {
    listeners.forEach((l) => l());
  }, [value]);
  return React.createElement(ServerListings.Provider, { value }, children);
}
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

export function useDirectoryState() {
  const server = React.useContext(ServerListings);
  const serverState = React.useMemo(() => (server ? { ...serverSnapshot, listings: server } : serverSnapshot), [server]);
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

export const directoryActions = {
  addListing(listing: Omit<MyListing, "id" | "publishedAt" | "messages">) {
    load();
    const id = `${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    set({ ...state, listings: [{ ...listing, id, publishedAt: new Date().toISOString(), messages: 0 }, ...state.listings] });
    return id;
  },
  markSold(id: string) {
    load();
    const listing = state.listings.find((l) => l.id === id);
    set({ ...state, listings: state.listings.map((l) => (l.id === id ? { ...l, soldAt: new Date().toISOString() } : l)) });
    if (remote && listing?.dbId) void markProductSold(listing.dbId);
  },
  remove(id: string) {
    load();
    const listing = state.listings.find((l) => l.id === id);
    set({ ...state, listings: state.listings.filter((l) => l.id !== id) });
    if (remote && listing?.dbId) void deleteProduct(listing.dbId);
  },
  saveServiceDraft(draft: ServiceDraft | null) {
    load();
    set({ ...state, serviceDraft: draft });
  },
};
