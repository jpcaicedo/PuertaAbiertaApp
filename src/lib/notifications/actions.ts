"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Marca una notificación como leída (al tocarla en N1). */
export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida_en: new Date().toISOString() }).eq("id", id).is("leida_en", null);
  revalidatePath("/", "layout");
}

/** "Marcar todas como leídas". */
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notificaciones").update({ leida_en: new Date().toISOString() }).eq("perfil_id", user.id).is("leida_en", null);
  revalidatePath("/", "layout");
}
