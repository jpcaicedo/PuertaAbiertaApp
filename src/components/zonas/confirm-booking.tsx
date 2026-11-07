"use client";

import * as React from "react";
import { zonesActions } from "@/lib/zones/store";

/** Marca la reserva como aprobada al abrir Z6 (mock de la respuesta de la administración). */
export function ConfirmBooking(props: { zoneId: string; day: string; start: string; end: string; guests: number }) {
  const { zoneId, day, start, end, guests } = props;
  React.useEffect(() => {
    zonesActions.save({ zoneId, day, start, end, guests, status: "confirmed" });
  }, [zoneId, day, start, end, guests]);
  return null;
}
