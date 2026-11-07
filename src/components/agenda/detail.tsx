"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Award, Calendar, Check, Clock, Info, MapPin, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheetClose } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/app/badge";
import type { CommunityActivity, NeighborhoodEvent } from "@/lib/agenda/data";
import { capacityLabel, formatLongDate, formatTime, formatTimeRange, organizerLabel, spotsLeft } from "@/lib/agenda/format";
import { agendaActions, useAgendaState } from "@/lib/agenda/store";
import { ActionBar, AvatarStack, DetailHero, DetailSheet, InfoList, InfoRow, Note } from "./primitives";
import { ResultSheet, WaitlistSheets } from "./sheets";

/** Lee un parámetro de acción (?inscribirme=1, ?voy=1), lo ejecuta una vez y lo quita de la URL. */
function useActionParam(name: string, run: () => void) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const done = React.useRef(false);
  React.useEffect(() => {
    if (done.current || params.get(name) !== "1") return;
    done.current = true;
    run();
    router.replace(pathname, { scroll: false });
  }, [params, name, run, router, pathname]);
}

/* ───────────────────────── A3 · Detalle de la actividad / A4 · Inscripción confirmada ───────────────────────── */

export function ActivityDetail({ activity }: { activity: CommunityActivity }) {
  const { enrolled, waitlist } = useAgendaState();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [waitlistFor, setWaitlistFor] = React.useState<CommunityActivity | null>(null);
  const isEnrolled = enrolled.includes(activity.id);
  const full = spotsLeft(activity) === 0;
  // El cupo propio cuenta en el resumen una vez inscrita.
  const view = isEnrolled ? { ...activity, enrolled: Math.min(activity.capacity, activity.enrolled + 1) } : activity;

  const enroll = React.useCallback(() => {
    if (full) return setWaitlistFor(activity);
    agendaActions.enroll(activity.id);
    setConfirmOpen(true);
  }, [activity, full]);
  useActionParam("inscribirme", enroll);

  const isToday = formatLongDate(activity.date).startsWith("Hoy");

  return (
    <>
      <DetailHero backHref="/agenda" image={activity.image} imageAlt={activity.imageAlt} />
      <DetailSheet>
        <Badge icon={activity.organizer.leader ? Award : Users} tone={activity.organizer.leader ? "warning" : "brand"}>
          {organizerLabel(activity.organizer)}
        </Badge>
        <h1 className="w-full text-display font-bold text-text">{activity.title}</h1>
        <InfoList>
          <InfoRow icon={Calendar}>{formatLongDate(activity.date)}</InfoRow>
          <InfoRow icon={Clock}>{formatTimeRange(activity.start, activity.end)}</InfoRow>
          <InfoRow icon={MapPin}>{activity.place}</InfoRow>
          <InfoRow icon={Users} tone={spotsLeft(view) === 0 ? "warning" : "success"}>
            {capacityLabel(view, true)}
          </InfoRow>
        </InfoList>
        <p className="text-body text-text-secondary">{activity.description}</p>
        <section aria-labelledby="quien-va" className="flex flex-col gap-2">
          <h2 id="quien-va" className="text-body font-semibold text-text">
            Quién va
          </h2>
          <AvatarStack people={activity.attendees} label={activity.attendeesLabel} />
        </section>
      </DetailSheet>

      <ActionBar>
        {isEnrolled ? (
          <Button variant="secondary" className="rounded-[80px]" onClick={() => agendaActions.cancel(activity.id)}>
            Cancelar mi inscripción
          </Button>
        ) : waitlist[activity.id] ? (
          <Button variant="secondary" disabled className="rounded-[80px] disabled:opacity-100">
            En lista de espera · puesto {waitlist[activity.id]}
          </Button>
        ) : full ? (
          <Button variant="secondary" className="rounded-[80px]" onClick={() => setWaitlistFor(activity)}>
            Unirme a la lista de espera
          </Button>
        ) : (
          <Button className="rounded-[80px]" onClick={enroll}>
            Inscribirme
          </Button>
        )}
      </ActionBar>

      <ResultSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={Check}
        tone="success"
        title="¡Listo, quedaste inscrita!"
        summary={`${activity.title} · ${isToday ? "Hoy" : formatLongDate(activity.date)}, ${formatTime(activity.start)} · ${activity.place}`}
        description="Te recordamos una hora antes. Si no puedes ir, cancela desde Mis inscripciones para liberar tu cupo."
      >
        <Button asChild className="rounded-[80px]">
          <Link href="/agenda">Volver a la agenda</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-[80px]">
          <Link href="/perfil/inscripciones">Ver mis inscripciones</Link>
        </Button>
      </ResultSheet>
      <WaitlistSheets activity={waitlistFor} onClose={() => setWaitlistFor(null)} />
    </>
  );
}

/* ───────────────────────── A9 · Evento del barrio / A10 · Vas al evento ───────────────────────── */

export function NeighborhoodEventDetail({ event }: { event: NeighborhoodEvent }) {
  const { going } = useAgendaState();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const isGoing = going.includes(event.id);

  const markGoing = React.useCallback(() => {
    if (!going.includes(event.id)) agendaActions.toggleGoing(event.id);
    setConfirmOpen(true);
  }, [event.id, going]);
  useActionParam("voy", markGoing);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`;
  const others = event.goingFromBuilding.map((p) => p.name.split(" ")[0]);
  const othersText = `${others.slice(0, -1).join(", ")} y ${others.at(-1)}`;

  return (
    <>
      <DetailHero backHref="/agenda" image={event.image} imageAlt={event.imageAlt} />
      <DetailSheet>
        <Badge icon={MapPin} tone="warning">
          En el barrio · {event.distanceLabel}
        </Badge>
        <h1 className="w-full text-display font-bold text-text">{event.title}</h1>

        <figure className="flex w-full items-start gap-2.5 rounded-card bg-surface p-3">
          {event.sharedBy.avatar && (
            <Image src={event.sharedBy.avatar} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-caption">
            <figcaption className="font-semibold text-text">
              Lo compartió {event.sharedBy.name} · Torre {event.sharedBy.tower}
            </figcaption>
            <blockquote className="text-text-secondary">&quot;{event.sharedByQuote}&quot;</blockquote>
          </div>
        </figure>

        <InfoList size="md">
          <InfoRow icon={Calendar}>{formatLongDate(event.date)}</InfoRow>
          <InfoRow icon={Clock}>{formatTimeRange(event.start, event.end)}</InfoRow>
          <InfoRow icon={MapPin}>{event.place}</InfoRow>
          <InfoRow icon={Tag}>
            {event.costLabel}
            {event.audienceLabel ? ` · ${event.audienceLabel}` : ""}
          </InfoRow>
        </InfoList>

        <section aria-labelledby="van" className="flex flex-col gap-2">
          <h2 id="van" className="text-body font-semibold text-text">
            Van de tu conjunto
          </h2>
          <AvatarStack people={event.goingFromBuilding} label={event.goingSummary} />
        </section>

        <Note icon={Info} tone="neutral">
          {event.organizerNote}
        </Note>
      </DetailSheet>

      <ActionBar>
        <Button asChild variant="secondary" className="flex-1 rounded-[80px]">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
        </Button>
        {isGoing ? (
          <Button variant="secondary" className="flex-1 rounded-[80px]" onClick={() => agendaActions.toggleGoing(event.id)}>
            <Check className="text-success" strokeWidth={2.5} aria-hidden />
            Vas a ir
          </Button>
        ) : (
          <Button className="flex-1 rounded-[80px]" onClick={markGoing}>
            Voy
          </Button>
        )}
      </ActionBar>

      <ResultSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={Check}
        tone="success"
        title="Tus vecinos verán que vas"
        description={`${othersText} también van. Pueden ponerse de acuerdo para ir juntos desde la portería.`}
        noHandle
      >
        <Button asChild className="rounded-[80px]">
          <Link href={`/directorio/${event.sharedBy.name.toLowerCase()}`}>Escribirle a {event.sharedBy.name}</Link>
        </Button>
        <BottomSheetClose asChild>
          <Button asChild variant="secondary" className="rounded-[80px]">
            <Link href="/agenda">Volver a la agenda</Link>
          </Button>
        </BottomSheetClose>
      </ResultSheet>
    </>
  );
}
