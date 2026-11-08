import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getNotices as demoNotices, type Notice } from "@/lib/mock-data";

/** Avisos de la administración (I1, I2, lista y X1). En modo demo, los de ejemplo. */

type Row = {
  id: string;
  titulo: string;
  mensaje: string;
  cuando: string;
  horario: string | null;
  lugar: string | null;
  resumen: string | null;
  audiencia: string;
  compartible: boolean;
  activo: boolean;
  publicado_en: string;
  conjuntos: { nombre: string } | null;
};

const COLUMNS = "id, titulo, mensaje, cuando, horario, lugar, resumen, audiencia, compartible, activo, publicado_en, conjuntos ( nombre )";

function toNotice(r: Row): Notice {
  const when = r.horario ? `${r.cuando}, ${r.horario}` : r.cuando;
  return {
    id: r.id,
    source: { short: "Admin", long: "Administración" },
    author: r.conjuntos ? `Administración ${r.conjuntos.nombre}` : "Administración",
    publishedAt: new Date(r.publicado_en),
    title: r.titulo,
    cardTitle: r.titulo,
    cardSummary: r.resumen ?? when,
    dateLabel: r.cuando,
    timeLabel: r.horario ?? "",
    placeLabel: r.lugar ?? "",
    body: r.mensaje,
    shareSummary: `${when}. ${r.mensaje}`,
    shareable: r.compartible,
    audience: r.audiencia,
  };
}

/** Avisos activos que el usuario puede ver, del más nuevo al más viejo. */
export const getNotices = cache(async (): Promise<Notice[]> => {
  if (!isSupabaseConfigured) return demoNotices();
  const supabase = await createClient();
  const { data } = await supabase
    .from("avisos")
    .select(COLUMNS)
    .eq("activo", true)
    .order("publicado_en", { ascending: false })
    .limit(50)
    .returns<Row[]>();
  return (data ?? []).map(toNotice);
});

export async function getNotice(id: string): Promise<Notice | null> {
  if (!isSupabaseConfigured) return demoNotices().find((n) => n.id === id) ?? null;
  // Ids de Supabase: uuid. Cualquier otra cosa (enlaces viejos del prototipo) no existe.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("avisos").select(COLUMNS).eq("id", id).maybeSingle<Row>();
  return data ? toNotice(data) : null;
}
