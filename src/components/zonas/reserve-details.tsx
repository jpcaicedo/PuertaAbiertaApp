"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { ActionBar } from "@/components/agenda/primitives";
import { cn } from "@/lib/utils";
import { getZone, type ApprovalZone } from "@/lib/zones/data";
import { reservationQuery, slotSummary, type ReservationType } from "@/lib/zones/reservation";
import { zonesActions } from "@/lib/zones/store";
import { reserveZone } from "@/lib/zones/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const types: {
  id: ReservationType;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    id: "privada",
    icon: Lock,
    title: "Reunión privada",
    description: "Cumpleaños, asado familiar o reunión con invitados. Solo la ven tú y la administración.",
  },
  {
    id: "comunidad",
    icon: Users,
    title: "Actividad para la comunidad",
    description: "Se publica en la Agenda y tus vecinos se pueden inscribir. Sigue el mismo paso de aprobación.",
  },
];

/** Opción de tipo: radio 16, padding 16, icono 20 en caja de 36 (blanca si está elegida). */
function TypeOption({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: (typeof types)[number] & { selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-card text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "border-2 border-brand bg-brand-soft p-4"
          : "border border-step-pending bg-surface p-4 hover:border-brand/40",
      )}
    >
      <span aria-hidden className={cn("inline-flex shrink-0 rounded-[10px] p-2 text-brand", selected && "bg-surface")}>
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-semibold text-text">{title}</span>
        <span className="text-caption text-text-secondary">{description}</span>
      </span>
    </button>
  );
}

type Errors = Partial<Record<"reason" | "guests", string>>;

/** Z4 · ¿Para quién es la reserva? (484:4421) → Z5. */
export function ReserveDetails({ zoneId, day, start }: { zoneId: string; day: string; start: string }) {
  const zone = getZone(zoneId) as ApprovalZone;
  const slot = zone.slots.find((s) => s.start === start)!;
  const router = useRouter();
  const [type, setType] = React.useState<ReservationType>("privada");
  const [reason, setReason] = React.useState("");
  const [guests, setGuests] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [sendError, setSendError] = React.useState<string>();
  const [sending, startSend] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(guests);
    const found: Errors = {};
    if (reason.trim().length < 3) found.reason = "Cuéntale a la administración para qué es.";
    if (!Number.isInteger(n) || n < 1) found.guests = "Indica cuántas personas van.";
    else if (n > zone.capacity) found.guests = `El aforo máximo es de ${zone.capacity} personas.`;
    setErrors(found);
    if (Object.keys(found).length) return;

    const next = `/zonas-comunes/${zone.id}/reservar/enviada?${reservationQuery({ day, slot, type, reason: reason.trim(), guests: n })}`;
    if (!isSupabaseConfigured) {
      // Modo demo: queda en el navegador.
      zonesActions.save({ zoneId: zone.id, day, start: slot.start, end: slot.end, status: "pending", guests: n });
      return router.push(next);
    }
    setSendError(undefined);
    startSend(async () => {
      const result = await reserveZone({
        zoneId: zone.id,
        day,
        start: slot.start,
        end: slot.end,
        type,
        reason: reason.trim(),
        guests: n,
      });
      if (!result.ok) return setSendError(result.error);
      router.push(next);
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref={`/zonas-comunes/${zone.id}/reservar?${reservationQuery({ day, slot })}`} />
      <form id="reserva" onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <ScreenBody gap={14} className="pt-3">
          <ScreenTitle>¿Para quién es la reserva?</ScreenTitle>
          <ScreenDescription size="sm">{slotSummary(zone, day, slot)}</ScreenDescription>

          <div role="radiogroup" aria-label="Tipo de reserva" className="flex w-full flex-col gap-3.5">
            {types.map((t) => (
              <TypeOption key={t.id} {...t} selected={type === t.id} onSelect={() => setType(t.id)} />
            ))}
          </div>

          <FormField id="motivo" label="Motivo" error={errors.reason}>
            {(aria) => (
              <Input
                {...aria}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={type === "privada" ? "Cumpleaños de mi hija" : "Torneo de rana del conjunto"}
                maxLength={80}
              />
            )}
          </FormField>

          <FormField id="invitados" label="Número de invitados" error={errors.guests}>
            {(aria) => (
              <Input
                {...aria}
                inputMode="numeric"
                autoComplete="off"
                value={guests}
                onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="25"
                endAdornment={<span className="text-body text-text-tertiary">personas</span>}
              />
            )}
          </FormField>
        </ScreenBody>
      </form>

      <ActionBar className="flex-col">
        {sendError && (
          <p role="alert" className="w-full text-caption text-error">
            {sendError}
          </p>
        )}
        <Button type="submit" form="reserva" className="w-full" disabled={sending}>
          {sending ? "Enviando…" : "Enviar solicitud a la administración"}
        </Button>
      </ActionBar>
    </Screen>
  );
}
