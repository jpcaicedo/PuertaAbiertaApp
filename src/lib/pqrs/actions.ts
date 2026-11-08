"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PqrsKind, PqrsStatus } from "./data";

export type PqrsInput = { kind: PqrsKind; title: string; place: string; description: string; photo?: string };

/** El vecino envía un reporte. La base de datos le avisa a la administración. */
export async function createPqrs(input: PqrsInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_pqrs", {
    p_tipo: input.kind,
    p_titulo: input.title,
    p_descripcion: input.description,
    p_lugar: input.place,
    p_foto: input.photo ?? null,
  });
  if (error || !data?.[0]) return { ok: false, error: "No pudimos enviar el reporte. Inténtalo de nuevo." };
  revalidatePath("/pqrs");
  revalidatePath("/admin", "layout");
  return { ok: true, id: data[0].id as string };
}

/** La administración cambia el estado con una nota. La base de datos le avisa al vecino. */
export async function updatePqrs(
  id: string,
  status: PqrsStatus,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_pqrs", { p_id: id, p_estado: status, p_nota: note });
  revalidatePath("/", "layout");
  if (error) {
    if (error.message.includes("SOLO_ADMIN")) return { ok: false, error: "Solo la administración puede cambiar el estado." };
    return { ok: false, error: "No pudimos guardar el cambio. Inténtalo de nuevo." };
  }
  return { ok: true };
}
