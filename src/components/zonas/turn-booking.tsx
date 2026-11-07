"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheetClose } from "@/components/ui/bottom-sheet";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { ResultSheet } from "@/components/agenda/sheets";
import { formatLongDate, formatTime, formatTimeRange } from "@/lib/agenda/format";
import { getZone, isTaken, remainingTurns, ZONES_TODAY, type Slot, type TurnZone } from "@/lib/zones/data";
import { findBooking, useZonesState, zonesActions } from "@/lib/zones/store";
import { SlotList, SlotOption, ZoneTag } from "./ui";

/** Z7 · Turco (484:4520) → Z7b · Turno confirmado (484:4551). Sin aprobación: reserva inmediata. */
/** Recibe el id (no el objeto) porque la zona lleva un componente de icono que no cruza al cliente. */
export function TurnBooking({ zoneId, initialStart }: { zoneId: string; initialStart?: string }) {
  const zone = getZone(zoneId) as TurnZone;
  const state = useZonesState();
  const turns = remainingTurns(zone);
  const [selected, setSelected] = React.useState<string | null>(
    turns.some((t) => t.start === initialStart && !isTaken(zone.id, ZONES_TODAY, t.start)) ? initialStart! : null,
  );
  const [done, setDone] = React.useState<Slot | null>(null);
  const [open, setOpen] = React.useState(false);

  const turn = turns.find((t) => t.start === selected);

  function reserve() {
    if (!turn) return;
    // TODO: POST /api/zonas/:id/reservas — confirmación inmediata.
    zonesActions.save({
      zoneId: zone.id,
      day: ZONES_TODAY,
      start: turn.start,
      end: turn.end,
      status: "confirmed",
    });
    setDone(turn);
    setOpen(true);
    setSelected(null);
  }

  return (
    <Screen>
      <ScreenHeader backHref="/zonas-comunes" />
      <ScreenBody gap={14} className="pt-3">
        <ZoneTag mode="slots">Turno inmediato · sin aprobación</ZoneTag>
        <ScreenTitle>{zone.name}</ScreenTitle>
        <ScreenDescription size="sm">{zone.description}</ScreenDescription>
        <h2 className="text-body font-semibold text-text">{formatLongDate(ZONES_TODAY)}</h2>
        {turns.length ? (
          <SlotList label="Turnos de hoy">
            {turns.map((t) => (
              <SlotOption
                key={t.start}
                start={t.start}
                end={t.end}
                state={
                  findBooking(state, zone.id, ZONES_TODAY, t.start)
                    ? "mine"
                    : isTaken(zone.id, ZONES_TODAY, t.start)
                      ? "taken"
                      : "available"
                }
                mineLabel="Tu turno"
                selected={selected === t.start}
                onSelect={() => setSelected(t.start)}
              />
            ))}
          </SlotList>
        ) : (
          <p className="text-body text-text-secondary">
            Ya no quedan turnos hoy. Vuelve mañana desde las {formatTime(zone.open)}.
          </p>
        )}
      </ScreenBody>

      <ActionBar>
        <Button className="flex-1" disabled={!turn} onClick={reserve}>
          {turn ? `Reservar turno de ${formatTime(turn.start)}` : "Elige un turno"}
        </Button>
      </ActionBar>

      <ResultSheet
        open={open}
        onOpenChange={setOpen}
        noHandle
        icon={Check}
        tone="success"
        title="Tu turno está listo"
        summary={done ? `${zone.name} · Hoy, ${formatTimeRange(done.start, done.end)}` : undefined}
        description="No necesita aprobación. Si no puedes ir, cancélalo para que otro vecino lo use."
      >
        <BottomSheetClose asChild>
          <Button>Listo</Button>
        </BottomSheetClose>
      </ResultSheet>
    </Screen>
  );
}
