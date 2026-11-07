import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Building, ChevronRight, MapPin, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "./badge";
import { ShareNotice } from "./share-notice";
import { formatTimeAgo, type Activity, type Notice, type Place } from "@/lib/mock-data";

/**
 * Patrón "stretched link": toda la tarjeta es clicable con un solo <a>,
 * y los botones internos (Compartir, Inscribirme) quedan por encima con z-10.
 */
const stretched = "after:absolute after:inset-0 after:content-[''] outline-none";
const cardFocus = "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand";

/** Aviso en Inicio (Figma "Aviso · Ascensores"): blanco, radio 20, padding 16, gap 8, sombra suave. */
export function NoticeCard({ notice, now }: { notice: Notice; now: Date }) {
  return (
    <article
      className={`relative flex w-full flex-col items-start gap-2 rounded-[20px] bg-surface p-4 shadow-card transition-shadow hover:shadow-button ${cardFocus}`}
    >
      <div className="flex w-full items-center gap-2">
        <Badge icon={Building}>{notice.source.short}</Badge>
        <span className="text-overline font-medium text-text-tertiary">{formatTimeAgo(notice.publishedAt, now)}</span>
        <span className="flex-1" />
        <ShareNotice notice={notice} variant="inline" />
      </div>
      <h3 className="text-body font-semibold text-text">
        <Link href={`/avisos/${notice.id}`} className={stretched}>
          {notice.cardTitle}
        </Link>
      </h3>
      <p className="text-caption text-text-secondary">{notice.cardSummary}</p>
    </article>
  );
}

/** Próxima actividad (Figma "Actividad · Yoga al atardecer"): foto 150 con degradado y píldoras, radio 20. */
export function ActivityCard({ activity }: { activity: Activity }) {
  const href = `/agenda/${activity.id}`;
  return (
    <article className={`relative flex w-full flex-col gap-3.5 overflow-hidden rounded-[20px] bg-surface ${cardFocus}`}>
      <div className="relative h-[150px] w-full">
        <Image src={activity.image} alt={activity.imageAlt} fill sizes="(max-width: 430px) 100vw, 390px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" aria-hidden />
        {/* Píldora de cuándo */}
        <span className="absolute top-5 left-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-micro font-bold tracking-[0.44px] text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.05)]">
          <span className="size-2 rounded-full bg-live-dot" aria-hidden />
          {activity.whenLabel}
        </span>
        {/* Organiza */}
        <span className="absolute bottom-[22px] left-4 inline-flex items-center gap-1 text-micro font-bold tracking-[0.275px] text-white">
          <BadgeCheck className="size-3.5" strokeWidth={2} aria-hidden />
          Organiza {activity.organizer}
        </span>
      </div>

      <div className="flex w-full flex-col gap-1.5 px-[17px]">
        <h3 className="text-subtitle font-medium tracking-[-0.2px] text-ink">
          <Link href={href} className={stretched}>
            {activity.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-overline text-text-secondary">
          <MapPin className="size-4 text-brand" strokeWidth={2} aria-hidden />
          {activity.place}
        </p>
        <p className="flex items-center gap-1.5 text-overline leading-[18px] font-medium text-success">
          <Users className="size-4" strokeWidth={2} aria-hidden />
          {activity.spotsLeft} cupos disponibles de {activity.capacity}
        </p>
      </div>

      <div className="w-full px-4 pt-[5px] pb-4">
        <Button asChild className="relative z-10">
          <Link href={`${href}?inscribirme=1`}>Inscribirme</Link>
        </Button>
      </div>
    </article>
  );
}

/** Recomendado (Figma "Recomendado · Café Samán"): blanco, radio 20, padding 12, foto 72 radio 14. */
export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link
      href={`/mapa/${place.id}`}
      className="flex w-full items-center gap-3 rounded-[20px] bg-surface p-3 transition-shadow hover:shadow-card outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <Image src={place.image} alt="" width={72} height={72} className="size-[72px] shrink-0 rounded-chip object-cover" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <p className="text-body font-semibold text-text">{place.name}</p>
        <p className="text-caption text-text-secondary">
          {place.recommendations} vecinos lo recomiendan · {place.distanceLabel}
        </p>
        {place.perk && (
          <Badge tone="success" icon={Tag}>
            {place.perk}
          </Badge>
        )}
      </div>
      <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
    </Link>
  );
}
