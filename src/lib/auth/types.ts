import { currentResident } from "@/lib/mock-data";

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
