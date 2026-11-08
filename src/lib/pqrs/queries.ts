import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { demoPqrs, pqrsNumber, type Pqrs, type PqrsKind, type PqrsStatus } from "./data";

type Row = {
  id: string;
  numero: number;
  tipo: PqrsKind;
  titulo: string;
  lugar: string | null;
  descripcion: string;
  foto: string | null;
  estado: PqrsStatus;
  created_at: string;
  actualizado_en: string;
  perfil_id: string;
  perfiles: { nombre: string; apartamentos: { numero: string; torres: { nombre: string } | null } | null } | null;
};

type EventRow = { pqrs_id: string; estado: PqrsStatus; nota: string | null; created_at: string };

const COLUMNS =
  "id, numero, tipo, titulo, lugar, descripcion, foto, estado, created_at, actualizado_en, perfil_id, perfiles(nombre, apartamentos(numero, torres(nombre)))";

function toPqrs(r: Row, events: EventRow[], photo?: string): Pqrs {
  const apt = r.perfiles?.apartamentos;
  return {
    id: r.id,
    number: pqrsNumber(r.numero),
    kind: r.tipo,
    title: r.titulo,
    place: r.lugar ?? undefined,
    description: r.descripcion,
    photo,
    status: r.estado,
    createdAt: r.created_at,
    updatedAt: r.actualizado_en,
    by: r.perfiles
      ? {
          name: r.perfiles.nombre.split(/\s+/)[0],
          unit: apt ? `Torre ${apt.torres?.nombre ?? ""}, apto ${apt.numero}` : "Administración",
        }
      : undefined,
    events: events.map((e) => ({ status: e.estado, note: e.nota ?? undefined, at: e.created_at })),
  };
}

/** Lista de reportes: los míos, o todos los del conjunto si `all` (la administración). */
async function list(all: boolean): Promise<Pqrs[]> {
  if (!isSupabaseConfigured) return demoPqrs();
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  let q = supabase.from("pqrs").select(COLUMNS).order("created_at", { ascending: false }).limit(100);
  if (!all) q = q.eq("perfil_id", user.id);
  const { data } = await q;
  return ((data ?? []) as unknown as Row[]).map((r) => toPqrs(r, []));
}

export const getMyPqrs = () => list(false);
export const getAdminPqrs = () => list(true);

/** Un reporte con su historial y la foto (enlace temporal de 1 h). */
export async function getPqrs(id: string): Promise<Pqrs | null> {
  if (!isSupabaseConfigured) return demoPqrs().find((p) => p.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const [{ data: row }, { data: events }] = await Promise.all([
    supabase.from("pqrs").select(COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("pqrs_eventos").select("pqrs_id, estado, nota, created_at").eq("pqrs_id", id).order("created_at"),
  ]);
  if (!row) return null;
  const r = row as unknown as Row;
  let photo: string | undefined;
  if (r.foto) {
    const { data } = await supabase.storage.from("pqrs").createSignedUrl(r.foto, 3600);
    photo = data?.signedUrl;
  }
  return toPqrs(r, (events ?? []) as EventRow[], photo);
}

/** Cuántos reportes abiertos tiene el conjunto (tarjeta del inicio de la administración). */
export async function countOpenPqrs(): Promise<number> {
  if (!isSupabaseConfigured) return demoPqrs().filter((p) => p.status !== "resuelto").length;
  const supabase = await createClient();
  const { count } = await supabase.from("pqrs").select("id", { count: "exact", head: true }).neq("estado", "resuelto");
  return count ?? 0;
}
