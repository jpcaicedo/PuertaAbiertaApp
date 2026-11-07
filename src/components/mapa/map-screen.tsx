"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { LocateFixed, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHeader } from "@/components/app/home-header";
import { currentResident } from "@/lib/mock-data";
import {
  RESIDENCE,
  formatDistance,
  placeFilters,
  places,
  type LngLat,
  type NeighborhoodPlace,
} from "@/lib/places/data";
import { cn } from "@/lib/utils";
import { placeIcons } from "./icons";
import { MapPin, ResidencePin } from "./map-pin";

/** Mapbox solo en el navegador (usa WebGL y `window`). Mientras carga se ve el fondo gris del contenedor. */
const NeighborhoodMap = dynamic(() => import("./neighborhood-map"), {
  ssr: false,
});
/** Sin token se usa el plano ilustrado del diseño. */
const USE_MAPBOX = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

type FilterId = (typeof placeFilters)[number]["id"];

/** Lugar que aparece destacado al abrir el mapa. */
const DEFAULT_PLACE = "cafe-saman-artesanal";

/**
 * M1 · Mapa (484:3258).
 * Fondo: mapa real de Mapbox si existe NEXT_PUBLIC_MAPBOX_TOKEN; si no, el plano ilustrado del diseño.
 * Encima: botón Centrar (overlay sin eventos salvo el botón) y la tarjeta del lugar destacado.
 */
export function MapScreen() {
  const [filter, setFilter] = React.useState<FilterId>("todos");
  const [selectedId, setSelectedId] = React.useState(DEFAULT_PLACE);

  const visible = places.filter((p) =>
    filter === "todos"
      ? true
      : filter === "beneficio"
        ? !!p.benefit
        : p.categories.includes(filter),
  );
  const selected = visible.find((p) => p.id === selectedId) ?? visible[0];
  const [focus, setFocus] = React.useState<{ key: number; to: LngLat }>();

  function select(id: string) {
    setSelectedId(id);
    const place = places.find((p) => p.id === id);
    if (place) setFocus({ key: Date.now(), to: place.coords });
  }

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg">
      <div className="shrink-0 pt-[max(40px,env(safe-area-inset-top))]">
        <HomeHeader {...currentResident} />
      </div>

      {/* Buscar + filtrar (46 de alto, radio 14, borde #E2E0E1) */}
      <div className="flex shrink-0 gap-2 px-5 pt-1">
        <Link
          href="/mapa/buscar"
          className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-chip border border-step-pending bg-surface px-3.5 text-body text-text-tertiary transition-colors hover:border-brand/50 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Search
            className="size-[18px] shrink-0 text-ink"
            strokeWidth={2}
            aria-hidden
          />
          Buscar lugares o beneficios
        </Link>
        <Link
          href="/mapa/buscar"
          aria-label="Filtrar lugares"
          className="grid size-[46px] shrink-0 place-items-center rounded-chip border border-step-pending bg-surface text-ink transition-colors hover:border-brand/50 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <SlidersHorizontal
            className="size-[18px]"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </div>

      {/* Categorías (radio 16, padding 6/12, 12/16 SemiBold) */}
      <div
        role="radiogroup"
        aria-label="Tipo de lugar"
        className="flex shrink-0 gap-2 overflow-x-auto px-5 pt-2 pb-2.5 [scrollbar-width:none]"
      >
        {placeFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 cursor-pointer rounded-card border px-3 py-1.5 text-overline font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
              filter === f.id
                ? "border-ink bg-ink text-white"
                : "border-border bg-surface text-text hover:border-brand/60",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mapa (fondo) + capa de controles encima */}
      <div className="relative flex-1 overflow-hidden bg-[#f9f9f9]">
        {USE_MAPBOX ? (
          <NeighborhoodMap
            places={visible}
            selectedId={selected?.id}
            onSelect={select}
            focus={focus}
          />
        ) : (
          <StaticMap
            places={visible}
            selectedId={selected?.id}
            onSelect={select}
          />
        )}

        {/* Overlay: no captura eventos para que el zoom y el arrastre lleguen al mapa; solo sus botones sí. */}
        <div className="pointer-events-none absolute inset-0">
          <button
            type="button"
            onClick={() => {
              setSelectedId(DEFAULT_PLACE);
              setFocus({ key: Date.now(), to: RESIDENCE.coords });
            }}
            aria-label="Centrar en mi conjunto"
            className="pointer-events-auto absolute top-4 right-[max(16px,calc(50%-179px))] grid cursor-pointer place-items-center rounded-[22px] bg-surface p-2.5 text-ink shadow-[0_4px_14px_rgb(0_0_0/0.14)] transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <LocateFixed className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {selected && <FeaturedPlace place={selected} />}
    </main>
  );
}

/** Plano ilustrado del diseño (respaldo cuando no hay token de Mapbox). Pines en px sobre 390×644. */
function StaticMap({
  places: list,
  selectedId,
  onSelect,
}: {
  places: NeighborhoodPlace[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="absolute top-0 left-1/2 h-[644px] w-[390px] -translate-x-1/2">
      <Image
        src="/images/mapa/plano-valle-del-lili.png"
        alt=""
        fill
        priority
        sizes="390px"
        className="pointer-events-none select-none"
      />
      <div
        className="absolute"
        style={{ left: RESIDENCE.pin.x, top: RESIDENCE.pin.y }}
      >
        <ResidencePin label={RESIDENCE.label} />
      </div>
      <ul aria-label="Lugares en el mapa">
        {list.map((p) =>
          p.pin ? (
            <li
              key={p.id}
              className={cn("absolute", p.id === selectedId && "z-10")}
              style={{ left: p.pin.x, top: p.pin.y }}
            >
              <MapPin
                place={p}
                selected={p.id === selectedId}
                onSelect={() => onSelect(p.id)}
              />
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

/** Tarjeta flotante (Figma "Lugar destacado"): 358 de ancho, radio 22, padding 14, a 14px de la barra inferior. */
function FeaturedPlace({ place }: { place: NeighborhoodPlace }) {
  const Icon = placeIcons[place.icon];
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.address}, Cali`)}`;
  return (
    <section
      aria-label={`Lugar destacado: ${place.name}`}
      className="fixed inset-x-0 bottom-[calc(var(--tabbar-offset)+78px)] z-30 mx-auto w-[calc(100%-32px)] max-w-[398px]"
    >
      <div className="relative flex w-full flex-col gap-2.5 rounded-[22px] bg-surface p-3.5 shadow-[0_4px_14px_rgb(0_0_0/0.12)] has-[a.stretched:focus-visible]:ring-2 has-[a.stretched:focus-visible]:ring-brand">
        <p className="text-overline font-medium text-brand uppercase">
          Recomendado por tus vecinos
        </p>
        <div className="flex w-full items-center gap-3">
          {place.image ? (
            <Image
              src={place.image}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-field object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-field bg-brand-soft text-brand"
            >
              <Icon className="size-6" strokeWidth={2} />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Link
              href={`/mapa/${place.id}`}
              className="stretched text-body font-semibold text-text outline-none after:absolute after:inset-0"
            >
              {place.name}
            </Link>
            <p className="text-caption text-text-secondary">
              {place.kind.split(" y ")[0]} · {formatDistance(place.distanceM)} ·{" "}
              {place.recommendations} vecinos
            </p>
          </div>
        </div>
        <div className="relative z-10 flex w-full gap-2">
          <Button asChild variant="secondary" className="h-11 flex-1">
            <a href={directions} target="_blank" rel="noopener noreferrer">
              Ver ruta
            </a>
          </Button>
          <Button asChild className="h-11 flex-1">
            <a
              href={`https://wa.me/${place.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactar
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
