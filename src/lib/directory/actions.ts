"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ServiceDraft } from "./store";

/** D6 · Publicar servicio. */
export async function publishService(
  draft: ServiceDraft,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("publicar_servicio", {
      p_categoria: draft.category,
      p_titulo: draft.title,
      p_descripcion: draft.description,
      p_precio: draft.price,
      p_disponibilidad: draft.availability,
      p_mostrar_apartamento: draft.showApartment,
      p_acepta_llamadas: draft.acceptCalls,
      p_telefono: draft.acceptCalls ? (draft.phone ?? "") : null,
    })
    .single<{ id: string; slug: string }>();
  revalidatePath("/", "layout");
  if (error || !data) {
    if (error?.message.includes("TELEFONO_INVALIDO")) return { ok: false, error: "Revisa el número de celular." };
    return { ok: false, error: "No pudimos publicar el servicio. Revisa los datos e inténtalo de nuevo." };
  }
  return { ok: true, slug: data.slug };
}
