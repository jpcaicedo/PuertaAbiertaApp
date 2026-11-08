"use client";

import { createClient } from "@/lib/supabase/client";
import { shrink } from "@/lib/profile/avatar";

/** Sube una foto o un audio del chat a la carpeta privada "chat/<id del vecino>/". Devuelve la ruta. */
export async function uploadChatFile(blob: Blob, ext: string, contentType: string): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return null;
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat").upload(path, blob, { contentType });
    return error ? null : path;
  } catch {
    return null;
  }
}

/** Foto reducida a 1600 px (JPEG) para que pese poco. */
export async function preparePhoto(file: File) {
  return shrink(file, 1600);
}

/** Enlace temporal (1 h) para ver una foto o escuchar un audio que acaba de llegar en vivo. */
export async function signedChatUrl(path: string): Promise<string | undefined> {
  const supabase = createClient();
  const { data } = await supabase.storage.from("chat").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

/** Formato de grabación que el navegador soporta (MP4/AAC se escucha en iPhone y Android). */
export function recorderMime(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const options = [
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  return options.find((o) => MediaRecorder.isTypeSupported(o.mime)) ?? null;
}
