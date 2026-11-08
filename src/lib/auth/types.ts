import { currentResident } from "@/lib/mock-data";
import type { NotifyKey, PrivacyKey } from "@/lib/profile/data";

export type PrivacyPrefs = Record<PrivacyKey, boolean>;
export type NotifyPrefs = Record<NotifyKey, boolean>;

export type Role = "vecino" | "administracion";

/** Lo que la interfaz necesita saber del vecino que inició sesión. */
export type CurrentUser = {
  id: string;
  fullName: string;
  firstName: string;
  tower: string;
  apartment: string;
  /** "Torre E · Apto 204" */
  unitLabel: string;
  avatar: string | null;
  bio: string | null;
  role: Role;
  /** Preferencias guardadas en Supabase (P3/P4). En modo demo no vienen y se usan las del navegador. */
  prefs?: { privacy: PrivacyPrefs; notify: NotifyPrefs };
  /** Notificaciones sin leer (punto rojo de la campana). Solo con Supabase. */
  unreadNotifications?: number;
};

/** Sandra, la vecina de ejemplo (modo demo sin Supabase). */
export const demoCurrentUser: CurrentUser = {
  id: "demo",
  fullName: currentResident.fullName,
  firstName: currentResident.firstName,
  tower: currentResident.tower,
  apartment: currentResident.apartment,
  unitLabel: currentResident.unitLabel,
  avatar: currentResident.avatar,
  bio: null,
  role: "vecino",
};
