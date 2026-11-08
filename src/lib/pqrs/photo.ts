"use client";

import { createClient } from "@/lib/supabase/client";
import { shrink } from "@/lib/profile/avatar";

/** Reduce la foto a 1600 px y la sube a la carpeta privada "pqrs/<id del vecino>/". Devuelve la ruta. */
export async function uploadPqrsPhoto(file: File): Promise<string | null> {
  try {
    const blob = await shrink(file, 1600);
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return null;
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from("pqrs").upload(path, blob, { contentType: "image/jpeg" });
    return error ? null : path;
  } catch {
    return null;
  }
}
