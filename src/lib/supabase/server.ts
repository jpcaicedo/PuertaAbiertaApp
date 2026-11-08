import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente de Supabase para páginas del servidor y Server Actions (lee y escribe la sesión en cookies).
 * Uno por petición: todas las consultas de una misma página lo comparten.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde una página del servidor no se pueden escribir cookies; el middleware refresca la sesión.
        }
      },
    },
  });
});

/**
 * Usuario de la sesión, verificado una sola vez por petición.
 * `getClaims()` revisa la firma del token sin ir al servidor de Supabase (con las llaves de firma
 * nuevas), así que es mucho más rápido que `getUser()`, que hacía un viaje de red en cada consulta.
 */
export const getSessionUser = cache(async (): Promise<{ id: string } | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? { id: sub } : null;
});
