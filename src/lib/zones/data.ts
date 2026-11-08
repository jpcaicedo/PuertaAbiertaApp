import { Droplets, Dumbbell, Flame, Globe, Sofa, Waves, type LucideIcon } from "lucide-react";
import { AGENDA_TODAY } from "@/lib/agenda/data";
import { parseDay, toDay } from "@/lib/agenda/format";
import { colombiaToday } from "@/lib/agenda/today";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Zonas comunes de Residencial Samán (mock).
 * TODO: reemplazar por la API:
 *   GET  /api/zonas                          · GET  /api/zonas/:id
 *   GET  /api/zonas/:id/disponibilidad?dia=  · POST /api/zonas/:id/reservas
 */

/** approval → franjas con aprobación (Z2→Z3→Z4→Z5→Z6) · slots → turno inmediato (Z7) · free → sin reserva (Z8). */
export type BookingMode = "approval" | "slots" | "free";

export type Slot = { start: string; end: string };

type ZoneBase = {
  id: string;
  name: string;
  /** Para frases: "Reservar el salón social", "tu reserva del salón social". */
  withArticle: string;
  icon: LucideIcon;
  /** Línea de la tarjeta de Z1. */
  summary: string;
  hours: string;
  capacity: number;
  location: string;
  /** Lugar corto para la confirmación (Z6): "Salón social, Torre A". */
  shortPlace: string;
  rules: string[];
  image?: string;
};

export type ApprovalZone = ZoneBase & {
  booking: "approval";
  /** Franjas fijas de cada día. */
  slots: Slot[];
  /** Días de anticipación mínima. */
  minDays: number;
  /** Cierre de la nota de Z6: "entrega el salón limpio". */
  handover: string;
};

export type TurnZone = ZoneBase & {
  booking: "slots";
  /** "Turnos de 45 minutos, máximo 4 personas. Ducha antes de entrar." */
  description: string;
  open: string;
  close: string;
  minutes: number;
};

export type FreeZone = ZoneBase & { booking: "free" };

export type Zone = ApprovalZone | TurnZone | FreeZone;

export const zones: Zone[] = [
  {
    id: "salon-social",
    name: "Salón social",
    withArticle: "el salón social",
    icon: Sofa,
    booking: "approval",
    summary: "8:00 a. m. a 10:00 p. m. · Torre A",
    hours: "8:00 a. m. a 10:00 p. m.",
    capacity: 40,
    location: "Primer piso, Torre A",
    shortPlace: "Salón social, Torre A",
    image: "/images/zonas/salon-social.jpg",
    minDays: 3,
    handover: "entrega el salón limpio",
    slots: [
      { start: "08:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
      { start: "18:00", end: "22:00" },
    ],
    rules: [
      "Reserva con mínimo 3 días de anticipación.",
      "La administración aprueba o propone otra franja en menos de 24 horas.",
      "Música a volumen moderado después de las 8:00 p. m.",
      "Entrega el salón limpio y sin decoración pegada en las paredes.",
    ],
  },
  {
    id: "zona-bbq",
    name: "Zona BBQ",
    withArticle: "la zona BBQ",
    icon: Flame,
    booking: "approval",
    summary: "10:00 a. m. a 9:00 p. m. · Terraza",
    hours: "10:00 a. m. a 9:00 p. m.",
    capacity: 20,
    location: "Terraza, Torre C",
    shortPlace: "Zona BBQ, terraza Torre C",
    minDays: 3,
    handover: "entrega la parrilla limpia",
    slots: [
      { start: "10:00", end: "15:00" },
      { start: "16:00", end: "21:00" },
    ],
    rules: [
      "Reserva con mínimo 3 días de anticipación.",
      "Trae tu carbón; la parrilla se entrega limpia.",
      "Apaga las brasas con agua antes de irte.",
      "Máximo 20 personas, incluidos niños.",
    ],
  },
  {
    id: "turco",
    name: "Turco",
    withArticle: "el turco",
    icon: Droplets,
    booking: "slots",
    summary: "Turnos de 45 min · 6:00 a. m. a 9:00 p. m.",
    description: "Turnos de 45 minutos, máximo 4 personas. Ducha antes de entrar.",
    hours: "6:00 a. m. a 9:00 p. m.",
    open: "06:00",
    close: "21:00",
    minutes: 45,
    capacity: 4,
    location: "Sótano, junto al gimnasio",
    shortPlace: "Turco, sótano",
    rules: ["Ducha antes de entrar.", "Máximo 4 personas por turno."],
  },
  {
    id: "cancha-multiple",
    name: "Cancha múltiple",
    withArticle: "la cancha múltiple",
    icon: Globe,
    booking: "slots",
    summary: "Turnos de 1 hora · 6:00 a. m. a 9:00 p. m.",
    description: "Turnos de 1 hora, máximo 10 personas. Usa tenis, no guayos.",
    hours: "6:00 a. m. a 9:00 p. m.",
    open: "06:00",
    close: "21:00",
    minutes: 60,
    capacity: 10,
    location: "Zona deportiva, detrás de la Torre C",
    shortPlace: "Cancha múltiple",
    rules: ["Usa tenis, no guayos.", "Máximo 10 personas por turno."],
  },
  {
    id: "piscina",
    name: "Piscina",
    withArticle: "la piscina",
    icon: Waves,
    booking: "free",
    summary: "6:00 a. m. a 9:00 p. m. · Cerrada los lunes",
    hours: "6:00 a. m. a 9:00 p. m.",
    capacity: 30,
    location: "Zona social, entre Torre B y C",
    shortPlace: "Piscina",
    rules: [
      "No necesita reserva: llega y úsala dentro del horario.",
      "Cerrada los lunes por mantenimiento.",
      "Niños menores de 12 años siempre con un adulto.",
      "Ducha obligatoria antes de entrar.",
    ],
  },
  {
    id: "gimnasio",
    name: "Gimnasio",
    withArticle: "el gimnasio",
    icon: Dumbbell,
    booking: "free",
    summary: "5:00 a. m. a 10:00 p. m.",
    hours: "5:00 a. m. a 10:00 p. m.",
    capacity: 12,
    location: "Primer piso, Torre B",
    shortPlace: "Gimnasio",
    rules: [
      "No necesita reserva: llega y úsalo dentro del horario.",
      "Lleva toalla y limpia las máquinas al terminar.",
      "Menores de 15 años no pueden usar las máquinas.",
    ],
  },
];

/** "del salón social", "de la zona BBQ". */
export const ofZone = (z: Pick<ZoneBase, "withArticle">) =>
  z.withArticle.startsWith("el ") ? `del ${z.withArticle.slice(3)}` : `de ${z.withArticle}`;

export const getZone = (id: string) => zones.find((z) => z.id === id);

/* ───────────────────────── Disponibilidad (mock) ───────────────────────── */

/** Hora simulada de "ahora" para los turnos de hoy (Z7 muestra desde las 6:00 p. m.). */
export const ZONES_NOW = "17:30";
export const ZONES_TODAY = AGENDA_TODAY;

/** Hoy real (Colombia) con Supabase; el 14 de octubre del prototipo en modo demo. */
export const zonesToday = () => (isSupabaseConfigured ? colombiaToday() : ZONES_TODAY);

/** Hora real (Colombia) con Supabase; 5:30 p. m. en modo demo. */
export function zonesNow() {
  if (!isSupabaseConfigured) return ZONES_NOW;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function addDays(day: string, n: number) {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

/**
 * Días que se pueden reservar en Z3: una semana de calendario a partir de
 * la siguiente semana (así lo muestra el diseño: miércoles 21 a martes 27),
 * siempre por encima de la anticipación mínima.
 */
export function bookableDays(zone: ApprovalZone, today = zonesToday()) {
  const first = addDays(today, Math.max(zone.minDays, 7));
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** Franjas ya ocupadas por otros vecinos: `zona → día → inicios`. */
const taken: Record<string, Record<string, string[]>> = {
  "salon-social": {
    "2026-10-22": ["18:00"],
    "2026-10-23": ["18:00"],
    "2026-10-24": ["13:00"],
    "2026-10-25": ["08:00", "13:00"],
  },
  "zona-bbq": { "2026-10-24": ["10:00"], "2026-10-25": ["10:00", "16:00"] },
  turco: { [ZONES_TODAY]: ["18:45"] },
  "cancha-multiple": { [ZONES_TODAY]: ["19:00"] },
};

export const isTaken = (zoneId: string, day: string, start: string) => taken[zoneId]?.[day]?.includes(start) ?? false;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Turnos de hoy que aún no han empezado (Z7). */
export function remainingTurns(zone: TurnZone, now = zonesNow()): Slot[] {
  const out: Slot[] = [];
  for (let t = toMin(zone.open); t + zone.minutes <= toMin(zone.close); t += zone.minutes) {
    if (t >= toMin(now)) out.push({ start: fromMin(t), end: fromMin(t + zone.minutes) });
  }
  return out;
}

/** Media hora antes y después de la franja, para la llave del salón (Z6). */
export const shiftTime = (hhmm: string, minutes: number) => fromMin(toMin(hhmm) + minutes);
