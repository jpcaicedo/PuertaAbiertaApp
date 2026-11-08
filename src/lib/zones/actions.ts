"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getZone } from "./data";

export type ReserveInput = {
  zoneId: string;
  day: string;
  start: string;
  end: string;
  type: "privada" | "comunidad" | "turno";
  reason?: string;
  guests?: number;
};

export type ReserveResult = { ok: true; status: "pendiente" | "aprobada" } | { ok: false; error: string };

/** Z4 (con aprobación) y Z7 (turno inmediato). La base de datos impide pedir una franja ya tomada. */
export async function reserveZone(input: ReserveInput): Promise<ReserveResult> {
  const zone = getZone(input.zoneId);
  if (!zone || zone.booking === "free") return { ok: false, error: "Esta zona no necesita reserva." };
  if ((zone.booking === "slots") !== (input.type === "turno")) return { ok: false, error: "Tipo de reserva no válido." };
  if (input.guests && input.guests > zone.capacity) {
    return { ok: false, error: `El aforo máximo es de ${zone.capacity} personas.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("reservar_zona", {
      p_zona: zone.id,
      p_lugar: zone.shortPlace,
      p_fecha: input.day,
      p_inicio: input.start,
      p_fin: input.end,
      p_tipo: input.type,
      p_motivo: input.reason ?? null,
      p_invitados: input.guests ?? null,
    })
    .single<{ id: string; estado: "pendiente" | "aprobada" }>();

  revalidatePath("/", "layout");
  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("FRANJA_OCUPADA")) return { ok: false, error: "Otro vecino acaba de tomar esa franja. Elige otra." };
    if (msg.includes("FECHA_PASADA")) return { ok: false, error: "Esa fecha ya pasó." };
    return { ok: false, error: "No pudimos enviar la reserva. Revisa tu conexión e inténtalo de nuevo." };
  }
  return { ok: true, status: data.estado };
}

export async function cancelReservation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_id: id });
  revalidatePath("/", "layout");
  return { ok: !error };
}
