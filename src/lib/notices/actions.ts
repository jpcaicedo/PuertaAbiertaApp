"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PublishNoticeInput = {
  title: string;
  message: string;
  when: string;
  audience: string;
  shareable: boolean;
  notify: boolean;
};

/** X5 · Publicar aviso. La base de datos solo lo acepta si quien publica es de la administración. */
export async function publishNotice(input: PublishNoticeInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("avisos").insert({
    titulo: input.title.trim(),
    mensaje: input.message.trim(),
    cuando: input.when.trim(),
    audiencia: input.audience,
    compartible: input.shareable,
    notificar: input.notify,
  });
  if (error) {
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "Solo la administración puede publicar avisos."
          : "No pudimos publicar el aviso. Revisa tu conexión e inténtalo de nuevo.",
    };
  }
  // TODO (bloque de notificaciones): si `notify`, enviar la notificación push.
  revalidatePath("/", "layout");
  return { ok: true };
}
