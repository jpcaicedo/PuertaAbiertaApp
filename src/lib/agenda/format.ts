import { type AgendaItem, type CommunityActivity, type TimeOfDay, timesOfDay } from "./data";
import { agendaToday } from "./today";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const WEEKDAYS_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Fecha local sin zona horaria a partir de "YYYY-MM-DD". */
export function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDay(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "6:30 p. m.", "8:00 a. m.", "12:00 m." (mediodía, como en el diseño). */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 12 && m === 0) return "12:00 m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} a ${formatTime(end)}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Hoy, miércoles 14 de octubre" · "Jueves 15 de octubre" */
export function formatLongDate(day: string, today = agendaToday()) {
  const d = parseDay(day);
  const label = `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  return day === today ? `Hoy, ${label}` : cap(label);
}

/** Píldora de las tarjetas: "Hoy · 6:30 p. m." · "Jue 15 · 7:00 p. m." */
export function formatWhen(item: Pick<AgendaItem, "date" | "start">, today = agendaToday()) {
  const d = parseDay(item.date);
  const prefix = item.date === today ? "Hoy" : `${cap(WEEKDAYS_SHORT[d.getDay()].toLowerCase())} ${d.getDate()}`;
  return `${prefix} · ${formatTime(item.start)}`;
}

export function weekdayShort(day: string) {
  return WEEKDAYS_SHORT[parseDay(day).getDay()];
}

export function weekdayLong(day: string) {
  return WEEKDAYS[parseDay(day).getDay()];
}

/** Lunes a domingo de la semana que contiene `day`. */
export function weekOf(day: string) {
  const d = parseDay(day);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return toDay(x);
  });
}

export function timeOfDay(hhmm: string): TimeOfDay {
  const h = Number(hhmm.split(":")[0]);
  return timesOfDay.find((t) => h >= t.from && h < t.to)?.id ?? "noche";
}

export function spotsLeft(a: CommunityActivity) {
  return Math.max(0, a.capacity - a.enrolled);
}

export function capacityLabel(a: CommunityActivity, long = false) {
  const left = spotsLeft(a);
  if (left === 0) return `${a.enrolled} de ${a.capacity} inscritos · Sin cupos`;
  return long
    ? `${a.enrolled} de ${a.capacity} inscritos · quedan ${left} ${left === 1 ? "cupo" : "cupos"}`
    : `${a.enrolled} de ${a.capacity} inscritos · ${left} ${left === 1 ? "cupo" : "cupos"}`;
}

export function organizerLabel(p: { name: string; tower?: string; leader?: boolean }) {
  if (p.leader) return `Organiza ${p.name} · Líder comunitaria`;
  return p.tower ? `Organiza ${p.name} · Torre ${p.tower}` : `Organiza ${p.name}`;
}
