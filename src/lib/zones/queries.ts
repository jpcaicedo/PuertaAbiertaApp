import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Franjas ocupadas de una zona entre dos días, leídas de Supabase.
 * Claves "YYYY-MM-DD|HH:MM". `null` en modo demo (la pantalla usa los datos de ejemplo).
 */
export type ZoneOccupancy = { taken: string[]; mine: string[] };

export async function getZoneOccupancy(zoneId: string, from: string, to: string): Promise<ZoneOccupancy | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("franjas_ocupadas", { p_zona: zoneId, p_desde: from, p_hasta: to });
  const rows = (data ?? []) as { fecha: string; inicio: string; mia: boolean }[];
  const key = (r: { fecha: string; inicio: string }) => `${r.fecha}|${r.inicio.slice(0, 5)}`;
  return {
    taken: rows.filter((r) => !r.mia).map(key),
    mine: rows.filter((r) => r.mia).map(key),
  };
}
