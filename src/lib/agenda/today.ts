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

/** Hora actual en Colombia ("HH:MM", 24 h). */
export function colombiaTime(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

/** Por venir · en curso · ya terminó. */
export type TimeStatus = "upcoming" | "ongoing" | "ended";

/**
 * Estado de una actividad según la hora de Colombia. En modo demo el prototipo vive siempre
 * el 14 de octubre, así que todo se considera por venir.
 */
export function activityStatus(item: { date: string; start: string; end: string }, now = new Date()): TimeStatus {
  if (!isSupabaseConfigured) return "upcoming";
  const today = colombiaToday(now);
  if (item.date > today) return "upcoming";
  if (item.date < today) return "ended";
  const time = colombiaTime(now);
  if (time >= item.end) return "ended";
  if (time >= item.start) return "ongoing";
  return "upcoming";
}
