import { formatLongDate, formatTime } from "./format";

/** Actividad recién creada, leída de la URL (mock hasta que exista la API). */
export type DraftActivity = { name: string; date: string; start: string; end: string; place: string; capacity: number };

export type DraftSearchParams = { nombre?: string; fecha?: string; inicio?: string; fin?: string; lugar?: string; cupos?: string };

export function readDraft(sp: DraftSearchParams): DraftActivity {
  return {
    name: sp.nombre || "Tarde de juegos de mesa",
    date: sp.fecha || "2026-10-24",
    start: sp.inicio || "16:00",
    end: sp.fin || "19:00",
    place: sp.lugar || "Salón social, Torre A",
    capacity: Number(sp.cupos) || 15,
  };
}

export function draftQuery(d: DraftActivity, extra: Record<string, string> = {}) {
  return new URLSearchParams({
    nombre: d.name,
    fecha: d.date,
    inicio: d.start,
    fin: d.end,
    lugar: d.place,
    cupos: String(d.capacity),
    ...extra,
  }).toString();
}

/** "Sábado 24 de octubre" */
export const draftDate = (d: DraftActivity) => formatLongDate(d.date, "");
/** "Sábado 24 de octubre, 4:00 p. m." */
export const draftWhen = (d: DraftActivity) => `${draftDate(d)}, ${formatTime(d.start)}`;
