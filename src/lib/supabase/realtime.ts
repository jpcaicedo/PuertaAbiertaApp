"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Se suscribe a cambios en vivo de Supabase con la sesión del usuario.
 * Antes de abrir el canal le pasa el token de la sesión a Realtime: sin eso, el canal entra como
 * anónimo y las reglas de la base de datos (RLS) no le dejan ver ninguna fila, así que nunca llegan avisos.
 * Devuelve la función para cerrar el canal (para el `return` de un useEffect).
 */
export function subscribeToChanges(name: string, setup: (channel: RealtimeChannel) => RealtimeChannel): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;
  let closed = false;

  void (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) await supabase.realtime.setAuth(data.session.access_token);
    if (closed) return;
    channel = setup(supabase.channel(name)).subscribe();
  })();

  return () => {
    closed = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
