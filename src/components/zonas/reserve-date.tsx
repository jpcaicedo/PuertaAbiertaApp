"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { formatLongDate } from "@/lib/agenda/format";
import { bookableDays, getZone, isTaken, type ApprovalZone } from "@/lib/zones/data";
import { reservationQuery } from "@/lib/zones/reservation";
import { findBooking, useZonesState } from "@/lib/zones/store";
import { DayStrip, SlotList, SlotOption } from "./ui";

/** Z3 · Elegir fecha y franja (484:4373). Día y franja viven en la URL para volver desde Z4 sin perderlos. */
export function ReserveDate({
  zoneId,
  day: initialDay,
  start: initialStart,
}: {
  zoneId: string;
  day?: string;
  start?: string;
}) {
  const zone = getZone(zoneId) as ApprovalZone;
  const router = useRouter();
  const state = useZonesState();
  const days = bookableDays(zone);
  const [day, setDay] = React.useState(initialDay && days.includes(initialDay) ? initialDay : days[0]);
  const [start, setStart] = React.useState<string | null>(initialStart ?? null);

  const stateOf = (s: string) =>
    findBooking(state, zone.id, day, s) ? "mine" : isTaken(zone.id, day, s) ? "taken" : "available";
  const slot = zone.slots.find((s) => s.start === start && stateOf(s.start) === "available");

  function sync(nextDay: string, nextStart: string | null) {
    const q = new URLSearchParams({ dia: nextDay });
    if (nextStart) q.set("franja", nextStart);
    router.replace(`/zonas-comunes/${zone.id}/reservar?${q}`, {
      scroll: false,
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref={`/zonas-comunes/${zone.id}`} />
      <ScreenBody gap={14} className="pt-3">
        <ScreenTitle>Reservar {zone.withArticle}</ScreenTitle>
        <ScreenDescription size="sm">
          Las fechas con menos de {zone.minDays} días de anticipación no están disponibles.
        </ScreenDescription>
        <DayStrip
          days={days}
          value={day}
          onChange={(d) => {
            setDay(d);
            setStart(null);
            sync(d, null);
          }}
        />
        <h2 className="text-body font-semibold text-text">{formatLongDate(day)}</h2>
        <SlotList label={`Franjas del ${formatLongDate(day).toLowerCase()}`}>
          {zone.slots.map((s) => (
            <SlotOption
              key={s.start}
              start={s.start}
              end={s.end}
              state={stateOf(s.start)}
              selected={slot?.start === s.start}
              onSelect={() => {
                setStart(s.start);
                sync(day, s.start);
              }}
            />
          ))}
        </SlotList>
      </ScreenBody>

      <ActionBar>
        {slot ? (
          <Button asChild className="flex-1">
            <Link href={`/zonas-comunes/${zone.id}/reservar/detalles?${reservationQuery({ day, slot })}`}>
              Continuar
            </Link>
          </Button>
        ) : (
          <Button className="flex-1" disabled>
            Elige una franja
          </Button>
        )}
      </ActionBar>
    </Screen>
  );
}
