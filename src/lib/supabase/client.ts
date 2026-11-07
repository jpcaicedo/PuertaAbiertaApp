"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/** Cliente de Supabase para componentes del navegador (tiempo real, subir fotos). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
