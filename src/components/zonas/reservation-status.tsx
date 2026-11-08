import Link from "next/link";
import { Calendar, Check, Clock, Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions } from "@/components/app/screen";
import { PushNotification } from "@/components/app/push-notification";
import { InfoList, InfoRow, Note, StatusCircle } from "@/components/agenda/primitives";
import { formatLongDate, formatTime, formatTimeRange } from "@/lib/agenda/format";
import { ofZone, shiftTime } from "@/lib/zones/data";
import { guestsLabel, reservationQuery, slotSummary, type Reservation } from "@/lib/zones/reservation";
import { ConfirmBooking } from "./confirm-booking";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Z5 · Solicitud de reserva enviada (484:4457), con la aprobación simulada a los 4 s → Z6. */
export function ReservationSent({ r }: { r: Reservation }) {
  return (
    <Screen>
      {/* Modo demo: la aprobación se simula a los 4 s. Con Supabase la decide la administración de verdad. */}
      {!isSupabaseConfigured && (
        <PushNotification href={`/zonas-comunes/${r.zone.id}/reservar/confirmada?${reservationQuery(r)}`}>
          La administración aprobó tu reserva {ofZone(r.zone)}. Toca para verla.
        </PushNotification>
      )}

      <div className="flex flex-col items-start gap-4 px-5 pt-[180px]">
        <StatusCircle icon={Clock} tone="warning" />
        <h1 className="text-title font-bold text-text">Solicitud enviada a la administración</h1>
        <p className="text-body font-semibold text-text">
          {slotSummary(r.zone, r.day, r.slot)}
          {r.guests > 0 && ` · ${guestsLabel(r.guests)}`}
        </p>
        <p className="text-caption text-text-secondary">
          Te avisamos cuando la administración responda. Si esa franja no se puede, te propone otra.
        </p>
      </div>

      <ScreenActions>
        <Button asChild className="rounded-[80px]">
          <Link href="/zonas-comunes">Volver a zonas comunes</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}

/** Z6 · Reserva confirmada (484:4477). */
export function ReservationConfirmed({ r }: { r: Reservation }) {
  const zone = r.zone;
  const Icon = zone.icon;
  return (
    <Screen>
      {!isSupabaseConfigured && (
        <ConfirmBooking zoneId={zone.id} day={r.day} start={r.slot.start} end={r.slot.end} guests={r.guests} />
      )}
      <div className="flex flex-col items-start gap-4 px-5 pt-[140px]">
        <StatusCircle icon={Check} tone="success" />
        <h1 className="text-title font-bold text-text">Tu reserva está confirmada</h1>
        <InfoList size="md">
          <InfoRow icon={Icon}>{zone.shortPlace}</InfoRow>
          <InfoRow icon={Calendar}>{formatLongDate(r.day)}</InfoRow>
          <InfoRow icon={Clock}>{formatTimeRange(r.slot.start, r.slot.end)}</InfoRow>
          {r.guests > 0 && <InfoRow icon={Users}>{guestsLabel(r.guests)}</InfoRow>}
        </InfoList>
        <Note icon={Info} tone="neutral">
          Recoge la llave en portería desde las {formatTime(shiftTime(r.slot.start, -30))} y {zone.handover} antes de
          las {formatTime(shiftTime(r.slot.end, 30))}
        </Note>
      </div>

      <ScreenActions className="pb-[max(44px,env(safe-area-inset-bottom))]">
        <Button asChild className="rounded-[80px]">
          <Link href="/inicio">Ir al inicio</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-[80px]">
          <Link href="/zonas-comunes">Volver a zonas comunes</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}
