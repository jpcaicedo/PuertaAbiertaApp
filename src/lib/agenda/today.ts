import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AGENDA_TODAY } from "./data";

/** Fecha de hoy en Colombia ("YYYY-MM-DD"), sin importar la zona del servidor o del teléfono. */
export function colombiaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
}

/** "Hoy" de la agenda: el real con Supabase, o el 14 de octubre del prototipo en modo demo. */
export function agendaToday() {
  return isSupabaseConfigured ? colombiaToday() : AGENDA_TODAY;
}
