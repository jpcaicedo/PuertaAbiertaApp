"use server";

import { createClient } from "@/lib/supabase/server";

/** D4 · Enviar mensaje. La base de datos verifica que el otro vecino sea del conjunto y acepte mensajes. */
export async function sendMessage(
  to: string,
  text: string,
  productId?: string,
): Promise<{ ok: true; id: string; createdAt: string } | { ok: false; error: string }> {
  const body = text.trim();
  if (!body) return { ok: false, error: "Escribe un mensaje." };
  if (body.length > 1000) return { ok: false, error: "El mensaje es muy largo." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mensajes")
    .insert(productId ? { para: to, texto: body, producto_id: productId } : { para: to, texto: body })
    .select("id, created_at")
    .single();
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("mensajes").update({ leido_en: new Date().toISOString() }).eq("de", peerId).eq("para", user.id).is("leido_en", null);
}
