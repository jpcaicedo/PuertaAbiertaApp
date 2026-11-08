"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import type { NotifyKey, PrivacyKey } from "./data";

const privacyColumn: Record<PrivacyKey, string> = {
  showApartment: "mostrar_apartamento",
  showPhone: "mostrar_telefono",
  inDirectory: "en_directorio",
  acceptMessages: "recibe_mensajes",
};

async function me() {
  const supabase = await createClient();
  const user = await getSessionUser();
  return { supabase, user };
}

/** P3 · Guarda un interruptor de privacidad. */
export async function savePrivacy(key: PrivacyKey, value: boolean) {
  const { supabase, user } = await me();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from("perfiles")
    .update({ [privacyColumn[key]]: value })
    .eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** P4 · Guarda las preferencias de notificaciones. */
export async function saveNotify(prefs: Record<NotifyKey, boolean>) {
  const { supabase, user } = await me();
  if (!user) return { ok: false };
  const { error } = await supabase.from("perfiles").update({ notificaciones: prefs }).eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** Guarda la foto ya subida a Storage. Solo acepta archivos de la carpeta del propio vecino. */
export async function saveAvatarUrl(url: string) {
  const { supabase, user } = await me();
  if (!user) return { ok: false };
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/avatares/${user.id}/`;
  if (!url.startsWith(prefix)) return { ok: false };
  const { error } = await supabase.from("perfiles").update({ avatar_url: url }).eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: !error };
}
