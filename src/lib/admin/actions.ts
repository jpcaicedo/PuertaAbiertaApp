"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseRequestId } from "./queries";

const decisionMap = { approved: "aprobar", rejected: "rechazar", proposed: "proponer" } as const;

/** X3 · Aprobar, rechazar o proponer otra fecha. La base de datos verifica que sea la administración. */
export async function decideRequest(
  id: string,
  decision: keyof typeof decisionMap,
  message?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = parseRequestId(id);
  if (!parsed) return { ok: false, error: "La solicitud no existe." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("decidir_solicitud", {
    p_tipo: parsed.tipo,
    p_id: parsed.uuid,
    p_decision: decisionMap[decision],
    p_mensaje: message ?? null,
  });
  revalidatePath("/", "layout");
  if (error) {
    if (error.message.includes("YA_DECIDIDA")) return { ok: false, error: "Esta solicitud ya tiene respuesta." };
    if (error.message.includes("SOLO_ADMIN")) return { ok: false, error: "Solo la administración puede responder." };
    return { ok: false, error: "No pudimos guardar la respuesta. Inténtalo de nuevo." };
  }
  // TODO (bloque de notificaciones): avisarle al vecino.
  return { ok: true };
}
