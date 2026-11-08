import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatTimeRange, parseDay, weekdayLong } from "@/lib/agenda/format";
import { getZone } from "@/lib/zones/data";
import {
  adminRequests,
  getAdminRequest as demoRequest,
  getReport as demoReport,
  reports as demoReports,
  type AdminRequest,
  type Report,
} from "./data";

/**
 * Solicitudes de la administración (X1–X4) leídas de la vista `solicitudes`.
 * Ids de la app: "a-<uuid>" para actividades y "r-<uuid>" para reservas.
 */

type Row = {
  tipo: "actividad" | "reserva";
  id: string;
  estado: string;
  titulo: string;
  fecha: string;
  inicio: string;
  fin: string;
  lugar: string;
  zona: string | null;
  personas: number | null;
  mensaje: string | null;
  alcance: "comunidad" | "privada";
  perfil_id: string;
  created_at: string;
};

type Person = { id: string; nombre: string; avatar_url: string | null; apartamentos: { torres: { nombre: string } | null } | null };

const COLUMNS = "tipo, id, estado, titulo, fecha, inicio, fin, lugar, zona, personas, mensaje, alcance, perfil_id, created_at";

export const toRequestId = (r: Pick<Row, "tipo" | "id">) => `${r.tipo === "actividad" ? "a" : "r"}-${r.id}`;

export function parseRequestId(id: string): { tipo: "actividad" | "reserva"; uuid: string } | null {
  const m = /^([ar])-([0-9a-f-]{36})$/i.exec(id);
  return m ? { tipo: m[1] === "a" ? "actividad" : "reserva", uuid: m[2] } : null;
}

const hhmm = (t: string) => t.slice(0, 5);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function toRequest(r: Row, by: Person | undefined, organized: number, conflicts: number, now: Date): AdminRequest {
  const d = parseDay(r.fecha);
  const range = formatTimeRange(hhmm(r.inicio), hhmm(r.fin));
  const hours = Math.floor((now.getTime() - new Date(r.created_at).getTime()) / 3_600_000);
  const minutes = Math.max(1, Math.round((now.getTime() - new Date(r.created_at).getTime()) / 60_000));
  const isActivity = r.alcance === "comunidad";
  const zone = r.zona ? getZone(r.zona) : undefined;
  const people = r.personas ?? 0;

  const checks = [
    conflicts === 0
      ? "El lugar está libre en esa franja."
      : "Ojo: ya hay algo aprobado en ese lugar a la misma hora.",
    hhmm(r.fin) <= "22:00" ? "Cumple las normas: termina antes de las 10:00 p. m." : "Termina después de las 10:00 p. m.",
  ];
  if (zone) checks.push(people <= zone.capacity ? `Cumple el aforo: máximo ${zone.capacity} personas.` : `Supera el aforo de ${zone.capacity} personas.`);

  return {
    id: toRequestId(r),
    kind: isActivity ? "activity" : "reservation",
    title: r.titulo,
    summary: `${r.lugar}, ${weekdayLong(r.fecha)} ${d.getDate()}, de ${range}`,
    place: r.lugar,
    when: `${cap(weekdayLong(r.fecha))} ${d.getDate()}, de ${range}`,
    capacity: isActivity
      ? `Hasta ${people} personas, abierta a todo el conjunto`
      : `${people} ${people === 1 ? "invitado" : "invitados"}, reunión privada`,
    by: {
      name: by?.nombre.split(/\s+/)[0] ?? "Vecino",
      tower: by?.apartamentos?.torres?.nombre ?? "",
      avatar: by?.avatar_url ?? undefined,
    },
    verb: isActivity ? "Propone" : "Pide",
    age: hours >= 12 ? `Lleva ${hours} h` : hours >= 1 ? `Hace ${hours} h` : `Hace ${minutes} min`,
    waitingHours: hours,
    overdue: hours >= 12,
    history:
      organized === 0
        ? "Primera vez que organiza un plan"
        : `Ha organizado ${organized} ${organized === 1 ? "plan" : "planes"} sin novedades`,
    message: r.mensaje?.trim() || "No dejó mensaje.",
    checks,
  };
}

async function enrich(rows: Row[]): Promise<AdminRequest[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  const ids = [...new Set(rows.map((r) => r.perfil_id))];
  const [{ data: people }, { data: done }, { data: approved }] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, avatar_url, apartamentos ( torres ( nombre ) )").in("id", ids).returns<Person[]>(),
    supabase.from("solicitudes").select("perfil_id").in("perfil_id", ids).in("estado", ["publicada", "aprobada"]),
    supabase
      .from("solicitudes")
      .select("id, lugar, fecha, inicio, fin")
      .in("estado", ["publicada", "aprobada"])
      .in(
        "fecha",
        rows.map((r) => r.fecha),
      ),
  ]);
  const now = new Date();
  return rows.map((r) => {
    const conflicts = (approved ?? []).filter(
      (o) => o.id !== r.id && o.lugar === r.lugar && o.fecha === r.fecha && o.inicio < r.fin && r.inicio < o.fin,
    ).length;
    const organized = (done ?? []).filter((d) => d.perfil_id === r.perfil_id).length;
    return toRequest(r, people?.find((p) => p.id === r.perfil_id), organized, conflicts, now);
  });
}

/** X2 · Pendientes, la más antigua primero. */
export async function getAdminRequests(): Promise<AdminRequest[]> {
  if (!isSupabaseConfigured) return adminRequests;
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes")
    .select(COLUMNS)
    .eq("estado", "pendiente")
    .order("created_at")
    .returns<Row[]>();
  return enrich(data ?? []);
}

/** X3/X4 · Una solicitud, sin importar si ya se decidió. */
export async function getAdminRequest(id: string): Promise<(AdminRequest & { pending: boolean }) | null> {
  if (!isSupabaseConfigured) {
    const r = demoRequest(id);
    return r ? { ...r, pending: true } : null;
  }
  const parsed = parseRequestId(id);
  if (!parsed) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes")
    .select(COLUMNS)
    .eq("tipo", parsed.tipo)
    .eq("id", parsed.uuid)
    .maybeSingle<Row>();
  if (!data) return null;
  const [request] = await enrich([data]);
  return { ...request, pending: data.estado === "pendiente" };
}

/* ───────────────────────── Reportes (X7, X8) ───────────────────────── */

type ReportRow = {
  id: string;
  motivo: string;
  estado: "abierto" | "retirado" | "mantenido";
  created_at: string;
  productos: {
    titulo: string;
    precio: number;
    fotos: string[];
    perfil_id: string | null;
    extra: { name?: string; tower?: string };
  } | null;
};

const guidanceByReason: Record<string, string> = {
  "No parece de un vecino del conjunto":
    "Revisa que quien vende viva en el conjunto. Si no lo reconoces, retírala y habla con portería.",
  "Producto prohibido o peligroso":
    "Si la prenda es de uso exclusivo de una institución, o si el producto incumple las normas de la comunidad, retírala. Al vendedor le llega el motivo.",
  "Precio o información engañosa":
    "Compara la descripción con las fotos. Si engaña a los compradores, retírala; si es un error menor, mantenla.",
};

async function toReports(rows: ReportRow[]): Promise<(Report & { open: boolean })[]> {
  const supabase = await createClient();
  const owners = [...new Set(rows.map((r) => r.productos?.perfil_id).filter((x): x is string => !!x))];
  const { data: people } = owners.length
    ? await supabase.from("perfiles").select("id, nombre, apartamentos ( torres ( nombre ) )").in("id", owners).returns<Person[]>()
    : { data: [] as Person[] };
  return rows.map((r) => {
    const p = r.productos;
    const owner = people?.find((x) => x.id === p?.perfil_id);
    const name = owner?.nombre ?? p?.extra?.name ?? "Vecino";
    const tower = owner?.apartamentos?.torres?.nombre ?? p?.extra?.tower ?? "";
    const firstName = name.split(/\s+/)[0];
    return {
      id: r.id,
      product: {
        title: p?.titulo ?? "Publicación",
        price: p?.precio ?? 0,
        image: p?.fotos[0] ?? "",
        seller: tower ? `${firstName}, Torre ${tower}` : firstName,
        sellerName: firstName,
      },
      reason: r.motivo,
      guidance:
        guidanceByReason[r.motivo] ??
        "Revisa la publicación con las normas de la comunidad. Si no las cumple, retírala; al vendedor le llega el motivo.",
      open: r.estado === "abierto",
    };
  });
}

const REPORT_COLUMNS = "id, motivo, estado, created_at, productos ( titulo, precio, fotos, perfil_id, extra )";

/** X1 · Reportes abiertos, el más antiguo primero. */
export async function getOpenReports(): Promise<Report[]> {
  if (!isSupabaseConfigured) return demoReports;
  const supabase = await createClient();
  const { data } = await supabase
    .from("reportes")
    .select(REPORT_COLUMNS)
    .eq("estado", "abierto")
    .order("created_at")
    .returns<ReportRow[]>();
  return toReports(data ?? []);
}

/** X7/X8 · Un reporte, abierto o ya resuelto. */
export async function getReportById(id: string): Promise<(Report & { open: boolean }) | null> {
  if (!isSupabaseConfigured) {
    const r = demoReport(id);
    return r ? { ...r, open: true } : null;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("reportes").select(REPORT_COLUMNS).eq("id", id).maybeSingle<ReportRow>();
  if (!data) return null;
  const [report] = await toReports([data]);
  return report;
}
