"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { demoKeyToTarget } from "./queries";

/**
 * D4 · Enviar mensaje. `to` es el id del vecino o "demo-s-camila" para un vecino de ejemplo.
 * La base de datos verifica que sea del conjunto y que acepte mensajes.
 */
export async function sendMessage(
  to: string,
  text: string,
  productId?: string,
): Promise<{ ok: true; id: string; createdAt: string } | { ok: false; error: string }> {
  const body = text.trim();
  if (!body) return { ok: false, error: "Escribe un mensaje." };
  if (body.length > 1000) return { ok: false, error: "El mensaje es muy largo." };
  const demo = demoKeyToTarget(to);
  const supabase = await createClient();
  const row: Record<string, string> = demo ? { para_demo: demo, texto: body } : { para: to, texto: body };
  if (productId) row.producto_id = productId;
  const { data, error } = await supabase.from("mensajes").insert(row).select("id, created_at").single();
  if (error || !data) {
    return {
      ok: false,
      error:
        error?.code === "42501"
          ? "Este vecino no recibe mensajes por la app."
          : "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.",
    };
  }
  return { ok: true, id: data.id, createdAt: data.created_at };
}

/** Marca como leídos los mensajes que llegaron mientras la conversación estaba abierta. */
export async function markConversationRead(peerId: string) {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return;
  await supabase.from("mensajes").update({ leido_en: new Date().toISOString() }).eq("de", peerId).eq("para", user.id).is("leido_en", null);
}

/**
 * Eliminar un mensaje, como en WhatsApp:
 *   · "me": deja de verse solo en mi chat (lo haya enviado o recibido).
 *   · "all": se borra para los dos (solo los que envié).
 */
export async function deleteMessage(id: string, scope: "me" | "all"): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return { ok: false };
  if (scope === "all") {
    const { data, error } = await supabase.from("mensajes").delete().eq("id", id).eq("de", user.id).select("id");
    revalidatePath("/", "layout");
    return { ok: !error && (data?.length ?? 0) > 0 };
  }
  const { error } = await supabase.rpc("ocultar_mensaje", { p_id: id });
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** Vaciar chat: la conversación desaparece solo para mí; el otro vecino conserva la suya. */
export async function deleteConversation(peerKey: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return { ok: false };
  const demo = demoKeyToTarget(peerKey);
  // Vecino de ejemplo: nadie más tiene esos mensajes, así que se borran.
  const { error } = demo
    ? await supabase.from("mensajes").delete().eq("de", user.id).eq("para_demo", demo)
    : await supabase.rpc("vaciar_conversacion", { p_vecino: peerKey });
  revalidatePath("/", "layout");
  return { ok: !error };
}
