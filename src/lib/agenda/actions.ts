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
