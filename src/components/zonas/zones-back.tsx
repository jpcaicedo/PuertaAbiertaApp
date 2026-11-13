"use client";

import { ScreenHeader } from "@/components/app/screen";
import { useZonesOrigin } from "@/lib/zones/origin";

/** Flecha de la lista de Zonas comunes: vuelve a Agenda si se entró desde "Reservar un espacio", si no a Inicio. */
export function ZonesBackHeader() {
  const origin = useZonesOrigin();
  return <ScreenHeader backHref={origin === "agenda" ? "/agenda" : "/inicio"} />;
}
