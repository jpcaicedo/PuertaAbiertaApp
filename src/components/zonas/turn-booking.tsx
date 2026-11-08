"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheetClose } from "@/components/ui/bottom-sheet";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { ResultSheet } from "@/components/agenda/sheets";
import { formatLongDate, formatTime, formatTimeRange } from "@/lib/agenda/format";
import { useRouter } from "next/navigation";
import { getZone, isTaken, remainingTurns, zonesToday, type Slot, type TurnZone } from "@/lib/zones/data";
import { reserveZone } from "@/lib/zones/actions";
import type { ZoneOccupancy } from "@/lib/zones/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findBooking, useZonesState, zonesActions } from "@/lib/zones/store";
import { SlotList, SlotOption, ZoneTag } from "./ui";

/** Z7 · Turco (484:4520) → Z7b · Turno confirmado (484:4551). Sin aprobación: reserva inmediata. */
/** Recibe el id (no el objeto) porque la zona lleva un componente de icono que no cruza al cliente. */
export function TurnBooking({
  zoneId,
  initialStart,
  occupancy,
}: {
  zoneId: string;
  initialStart?: string;
  /** Con Supabase: turnos tomados y propios de hoy. Sin él, datos de ejemplo. */
  occupancy?: ZoneOccupancy | null;
}) {
  const zone = getZone(zoneId) as TurnZone;
  const state = useZonesState();
  const router = useRouter();
  const today = zonesToday();
  const turns = remainingTurns(zone);
  const [error, setError] = React.useState<string>();
  const [saving, startSave] = React.useTransition();
  const stateOf = (start: string) => {
    if (occupancy) {
      const key = `${today}|${start}`;
      return occupancy.mine.includes(key) ? "mine" : occupancy.taken.includes(key) ? "taken" : "available";
    }
    return findBooking(state, zone.id, today, start) ? "mine" : isTaken(zone.id, today, start) ? "taken" : "available";
  };
  const [selected, setSelected] = React.useState<string | null>(
    turns.some((t) => t.start === initialStart && stateOf(t.start) === "available") ? initialStart! : null,
  );
  const [done, setDone] = React.useState<Slot | null>(null);
  const [open, setOpen] = React.useState(false);

  const turn = turns.find((t) => t.start === selected);

  function reserve() {
    if (!turn) return;
    const finish = () => {
      setDone(turn);
      setOpen(true);
      setSelected(null);
    };
    if (!isSupabaseConfigured) {
      zonesActions.save({ zoneId: zone.id, day: today, start: turn.start, end: turn.end, status: "confirmed" });
      return finish();
    }
    setError(undefined);
    startSave(async () => {
      const result = await reserveZone({ zoneId: zone.id, day: today, start: turn.start, end: turn.end, type: "turno" });
      if (!result.ok) {
        setError(result.error);
        router.refresh();
        return;
      }
      finish();
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref="/zonas-comunes" />
      <ScreenBody gap={14} className="pt-3">
        <ZoneTag mode="slots">Turno inmediato · sin aprobación</ZoneTag>
        <ScreenTitle>{zone.name}</ScreenTitle>
        <ScreenDescription size="sm">{zone.description}</ScreenDescription>
        <h2 className="text-body font-semibold text-text">{formatLongDate(today)}</h2>
        {turns.length ? (
          <SlotList label="Turnos de hoy">
            {turns.map((t) => (
              <SlotOption
                key={t.start}
                start={t.start}
                end={t.end}
                state={stateOf(t.start)}
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

      <ActionBar className="flex-col">
        {error && (
          <p role="alert" className="w-full text-caption text-error">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={!turn || saving} onClick={reserve}>
          {saving ? "Reservando…" : turn ? `Reservar turno de ${formatTime(turn.start)}` : "Elige un turno"}
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
