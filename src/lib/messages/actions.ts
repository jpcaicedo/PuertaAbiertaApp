"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("mensajes").update({ leido_en: new Date().toISOString() }).eq("de", peerId).eq("para", user.id).is("leido_en", null);
}

/**
 * Eliminar un mensaje. Si lo envié yo, se borra para los dos.
 * Si lo recibí, deja de verse solo en mi chat.
 */
export async function deleteMessage(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: mine } = await supabase.from("mensajes").delete().eq("id", id).eq("de", user.id).select("id");
  if (!mine?.length) {
    const { error } = await supabase.from("mensajes").update({ oculto_para_receptor: true }).eq("id", id).eq("para", user.id);
    if (error) return { ok: false };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Vaciar una conversación: borra lo que envié y oculta lo que recibí. */
export async function deleteConversation(peerKey: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const demo = demoKeyToTarget(peerKey);
  if (demo) {
    const { error } = await supabase.from("mensajes").delete().eq("de", user.id).eq("para_demo", demo);
    revalidatePath("/", "layout");
    return { ok: !error };
  }
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("mensajes").delete().eq("de", user.id).eq("para", peerKey),
    supabase.from("mensajes").update({ oculto_para_receptor: true }).eq("de", peerKey).eq("para", user.id),
  ]);
  revalidatePath("/", "layout");
  return { ok: !e1 && !e2 };
}
