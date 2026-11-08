"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, Building, Check, Clock, Dumbbell, GraduationCap, MapPin, PawPrint, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/app/badge";
import type { Category, CommunityActivity, NeighborhoodEvent } from "@/lib/agenda/data";
import { capacityLabel, formatTime, formatWhen, organizerLabel, spotsLeft } from "@/lib/agenda/format";
import { activityStatus, type TimeStatus } from "@/lib/agenda/today";
import { useAgendaState } from "@/lib/agenda/store";
import { cn } from "@/lib/utils";

const stretched = "after:absolute after:inset-0 after:content-[''] outline-none";
const cardBase =
  "relative flex w-full flex-col overflow-hidden rounded-[20px] bg-surface has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand";

/** Icono para la cabecera ilustrada según la primera categoría. */
const categoryIcon: Record<Category, LucideIcon> = {
  deporte: Dumbbell,
  mascotas: PawPrint,
  comida: UtensilsCrossed,
  ninos: BookOpen,
  cultura: BookOpen,
  aprender: GraduationCap,
};

/** Cabecera de tarjeta: foto 150 o ilustración 120 (#FFF1DC + icono 56), con píldora de hora. */
function CardHeader({ item, status }: { item: CommunityActivity | NeighborhoodEvent; status: TimeStatus }) {
  const Icon = categoryIcon[item.categories[0]];
  return (
    <div className={cn("relative w-full shrink-0", item.image ? "h-[150px]" : "h-[120px] bg-illustration")}>
      {item.image ? (
        <Image src={item.image} alt={item.imageAlt ?? ""} fill sizes="(max-width: 430px) 100vw, 390px" quality={90} className="object-cover" />
      ) : (
        <Icon className="absolute top-8 left-1/2 size-14 -translate-x-1/2 text-illustration-ink" strokeWidth={2} aria-hidden />
      )}
      <span
        className={cn(
          "absolute top-3 left-3 inline-flex items-center gap-[5px] rounded-[20px] py-[5px] pr-2.5 pl-2 text-overline font-medium text-white",
          status === "ended" ? "bg-ink/70" : "bg-brand",
        )}
      >
        <Clock className="size-3.5" strokeWidth={2} aria-hidden />
        {status === "ended" ? "Ya terminó" : status === "ongoing" ? `En curso · hasta ${formatTime(item.end)}` : formatWhen(item)}
      </span>
    </div>
  );
}

type ActivityCardProps = {
  activity: CommunityActivity;
  onJoinWaitlist: (activity: CommunityActivity) => void;
};

/**
 * Actividad del conjunto (A2, A5, A13): foto + insignias + título 18/24 + lugar + cupos + botón de 52.
 * El botón cambia según el estado: Inscribirme · Ya estás inscrita · Lista de espera · En lista de espera.
 */
export function ActivityListCard({ activity, onJoinWaitlist }: ActivityCardProps) {
  const { enrolled, waitlist } = useAgendaState();
  const href = `/agenda/${activity.id}`;
  const isEnrolled = enrolled.includes(activity.id);
  const waitPosition = waitlist[activity.id];
  // Ya empezó o terminó: no se puede inscribir ni entrar a la lista de espera.
  const status = activityStatus(activity);
  const started = status !== "upcoming";
  // El cupo propio cuenta en el resumen una vez inscrita (como en el detalle).
  const view = isEnrolled ? { ...activity, enrolled: Math.min(activity.capacity, activity.enrolled + 1) } : activity;
  const full = spotsLeft(view) === 0;

  return (
    <article className={cn(cardBase, status === "ended" && "opacity-70")}>
      <CardHeader item={activity} status={status} />
      <div className="flex w-full flex-col items-start gap-2 px-4 pt-3.5 pb-4">
        <Badge icon={Building}>En tu conjunto</Badge>
        <Badge icon={activity.organizer.leader ? Award : Users} tone={activity.organizer.leader ? "warning" : "brand"}>
          {organizerLabel(activity.organizer)}
        </Badge>
        <h3 className="text-heading font-semibold text-text">
          <Link href={href} className={stretched}>
            {activity.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-caption text-text-secondary">
          <MapPin className="size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
          {activity.place}
        </p>
        <p className={cn("flex items-center gap-1.5 text-caption", full ? "text-warning" : "text-success")}>
          <Users className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {capacityLabel(view)}
        </p>

        <div className="relative z-10 w-full">
          {isEnrolled ? (
            <Button asChild variant="secondary" className="h-[52px]">
              <Link href={href}>
                <Check className="text-success" strokeWidth={2.5} aria-hidden />
                Ya estás inscrita
              </Link>
            </Button>
          ) : started ? null : waitPosition ? (
            <Button variant="secondary" disabled className="h-[52px] disabled:opacity-100">
              En lista de espera · puesto {waitPosition}
            </Button>
          ) : full ? (
            <Button variant="secondary" className="h-[52px]" onClick={() => onJoinWaitlist(activity)}>
              Unirme a la lista de espera
            </Button>
          ) : (
            <Button asChild className="h-[52px]">
              <Link href={`${href}?inscribirme=1`}>Inscribirme</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Evento del barrio (A13): cabecera ilustrada, insignia naranja, quién lo compartió, botón Voy. */
export function NeighborhoodEventCard({ event }: { event: NeighborhoodEvent }) {
  const { going } = useAgendaState();
  const href = `/agenda/${event.id}`;
  const isGoing = going.includes(event.id);
  const status = activityStatus(event);

  return (
    <article className={cn(cardBase, status === "ended" && "opacity-70")}>
      <CardHeader item={event} status={status} />
      <div className="flex w-full flex-col items-start gap-2 px-4 pt-3.5 pb-4">
        <Badge icon={MapPin} tone="warning">
          En el barrio · {event.distanceLabel}
        </Badge>
        <h3 className="text-heading font-semibold text-text">
          <Link href={href} className={stretched}>
            {event.title}
          </Link>
        </h3>
        <p className="flex items-center gap-2 text-caption text-text-secondary">
          {event.sharedBy.avatar && (
            <Image src={event.sharedBy.avatar} alt="" width={20} height={20} className="size-5 rounded-full object-cover" />
          )}
          Lo compartió {event.sharedBy.name} · Torre {event.sharedBy.tower}
        </p>
        <p className="flex items-center gap-1.5 text-caption text-text-secondary">
          <MapPin className="size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
          {event.place} · {event.costLabel}
        </p>
        <p className="flex items-center gap-1.5 text-caption text-success">
          <Users className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {event.goingCountLabel}
        </p>
        <div className="relative z-10 w-full">
          {isGoing ? (
            <Button asChild variant="secondary" className="h-[52px]">
              <Link href={href}>
                <Check className="text-success" strokeWidth={2.5} aria-hidden />
                Vas a ir
              </Link>
            </Button>
          ) : status === "ended" ? null : (
            <Button asChild className="h-[52px]">
              <Link href={`${href}?voy=1`}>Voy</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
