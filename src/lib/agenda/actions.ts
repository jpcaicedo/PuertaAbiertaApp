"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Acciones de la agenda contra Supabase. Las funciones SQL revisan cupos y permisos. */

export type EnrollResult = { ok: true; status: "inscrito" | "espera"; position: number | null } | { ok: false };

export async function enrollActivity(dbId: string): Promise<EnrollResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inscribirme", { p_actividad: dbId }).single<{
    estado: "inscrito" | "espera";
    puesto: number | null;
  }>();
  revalidatePath("/", "layout");
  if (error || !data) return { ok: false };
  return { ok: true, status: data.estado, position: data.puesto };
}

export async function cancelEnrollment(dbId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_inscripcion", { p_actividad: dbId });
  revalidatePath("/", "layout");
  return { ok: !error };
}

export async function setGoing(dbId: string, going: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_voy", { p_actividad: dbId, p_voy: going });
  revalidatePath("/", "layout");
  return { ok: !error };
}

export type ProposeInput = {
  name: string;
  description: string;
  date: string;
  start: string;
  end: string;
  place: string;
  capacity: number;
  usesArea: boolean;
};

/** A6 · Crear actividad. Con zona común queda pendiente para la administración; sin zona se publica de una. */
export async function proposeActivity(
  input: ProposeInput,
): Promise<{ ok: true; slug: string; status: "pendiente" | "publicada" } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("proponer_actividad", {
      p_titulo: input.name,
      p_descripcion: input.description,
      p_fecha: input.date,
      p_inicio: input.start,
      p_fin: input.end,
      p_lugar: input.place,
      p_cupos: input.capacity,
      p_usa_zona: input.usesArea,
    })
    .single<{ id: string; slug: string; estado: "pendiente" | "publicada" }>();
  revalidatePath("/", "layout");
  if (error || !data) {
    if (error?.message.includes("FECHA_PASADA")) return { ok: false, error: "Elige una fecha de hoy en adelante." };
    return { ok: false, error: "No pudimos crear la actividad. Revisa tu conexión e inténtalo de nuevo." };
  }
  return { ok: true, slug: data.slug, status: data.estado };
}
