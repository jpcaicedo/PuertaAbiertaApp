"use client";

import { createClient } from "@/lib/supabase/client";
import { shrink } from "@/lib/profile/avatar";

/** Sube las fotos del producto a Supabase Storage (productos/<id del vecino>/…), reducidas a 1200 px. */
export async function uploadProductPhotos(files: File[]): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Tu sesión se cerró. Vuelve a entrar." };

    const stamp = Date.now();
    const urls = await Promise.all(
      files.map(async (file, i) => {
        const blob = await shrink(file, 1200);
        const path = `${user.id}/${stamp}-${i + 1}.jpg`;
        const { error } = await supabase.storage.from("productos").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        return supabase.storage.from("productos").getPublicUrl(path).data.publicUrl;
      }),
    );
    return { ok: true, urls };
  } catch {
    return { ok: false, error: "No pudimos subir las fotos. Revisa tu conexión e inténtalo de nuevo." };
  }
}
