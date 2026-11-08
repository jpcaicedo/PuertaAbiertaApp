"use client";

import { createClient } from "@/lib/supabase/client";
import { saveAvatarUrl } from "./actions";

/** Reduce la foto a 512 px de lado (JPEG) antes de subirla: carga rápido y no gasta espacio. */
export async function shrink(file: File, max = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la foto"))), "image/jpeg", 0.85),
  );
}

/** Sube la foto de perfil a Supabase Storage (avatares/<id>/…) y la guarda en el perfil. */
export async function uploadAvatar(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "Elige una imagen." };
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Tu sesión se cerró. Vuelve a entrar." };

    const blob = await shrink(file);
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatares").upload(path, blob, { contentType: "image/jpeg" });
    if (error) return { ok: false, error: "No pudimos subir la foto. Inténtalo de nuevo." };

    const url = supabase.storage.from("avatares").getPublicUrl(path).data.publicUrl;
    const saved = await saveAvatarUrl(url);
    return saved.ok ? { ok: true, url } : { ok: false, error: "No pudimos guardar la foto." };
  } catch {
    return { ok: false, error: "No pudimos leer esa imagen. Prueba con otra." };
  }
}
