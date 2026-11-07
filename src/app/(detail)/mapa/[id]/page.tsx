import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/app/screen";
import { DetailHero, DetailSheet } from "@/components/agenda/primitives";
import { placeIcons } from "@/components/mapa/icons";
import { formatDistance, getPlace, places } from "@/lib/places/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return places.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const place = getPlace((await params).id);
  return { title: place ? `${place.name} · Mapa` : "Mapa" };
}

/** M3 · Detalle del lugar (484:3509) */
export default async function LugarPage({ params }: Props) {
  const place = getPlace((await params).id);
  if (!place) notFound();

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.address}, Cali`)}`;
  const meta = [place.kind, formatDistance(place.distanceM), place.openUntil && `Abierto hasta ${place.openUntil}`].filter(Boolean).join(" · ");

  return (
    <Screen>
      <DetailHero backHref="/mapa" image={place.cover} imageAlt={place.name} illustration={placeIcons[place.icon]} photoHeight={260} />
      <DetailSheet>
        <h1 className="w-full text-display font-bold text-text">{place.name}</h1>
        <p className="text-caption text-text-secondary">{meta}</p>

        {place.benefit && (
          <div className="flex w-full items-start gap-2.5 rounded-card bg-success-soft p-3.5 text-success">
            <Tag className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            <div className="flex flex-col gap-0.5">
              <p className="text-body font-semibold">{place.benefit.title}</p>
              <p className="text-caption">{place.benefit.detail}</p>
            </div>
          </div>
        )}

        <section aria-labelledby="opiniones" className="flex w-full flex-col gap-2.5">
          <h2 id="opiniones" className="text-body font-semibold text-text">
            Lo que dicen tus vecinos · {place.recommendations} lo recomiendan
          </h2>
          <ul className="flex flex-col gap-2.5">
            {place.reviews.map((r) => (
              <li key={r.name} className="flex w-full items-start gap-2.5 rounded-card bg-surface p-3">
                {r.avatar ? (
                  <Image src={r.avatar} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-overline font-medium text-brand">
                    {r.name[0]}
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-caption">
                  <p className="font-semibold text-text">
                    {r.name} · Torre {r.tower}
                  </p>
                  <p className="text-text-secondary">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="flex items-center gap-2 text-caption text-text-secondary">
          <MapPin className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {place.address}, {formatDistance(place.distanceM)} de la portería
        </p>
      </DetailSheet>

      {/* Barra de acción con nota: padding 12/20/24, gap 6 */}
      <div aria-hidden className="h-[132px] shrink-0" />
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] flex-col items-center gap-1.5 bg-surface px-5 pt-3 pb-[max(24px,calc(var(--safe-bottom)+12px))] shadow-bar">
        <div className="flex w-full gap-2">
          <Button asChild variant="secondary" className="h-[52px] flex-1">
            <a href={directions} target="_blank" rel="noopener noreferrer">
              Ver ruta
            </a>
          </Button>
          <Button asChild className="h-[52px] flex-1">
            <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noopener noreferrer">
              Contactar
            </a>
          </Button>
        </div>
        <p className="text-overline font-medium text-text-tertiary">Ambos se abren fuera de Puerta Abierta.</p>
      </div>
    </Screen>
  );
}
