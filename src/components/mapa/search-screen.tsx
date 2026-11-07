"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/app/screen";
import { RESIDENCE, formatDistance, searchPlaces, type NeighborhoodPlace } from "@/lib/places/data";
import { placeIcons } from "./icons";

/** M2 · Buscar lugares (484:3548) y M2b · Sin resultados (484:3584). */
export function SearchScreen({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState(initialQuery);
  const results = searchPlaces(query);
  const term = query.trim();

  // Mantiene ?q= en la URL (sin llenar el historial) para poder volver al mismo resultado.
  React.useEffect(() => {
    const t = setTimeout(() => router.replace(term ? `${pathname}?q=${encodeURIComponent(term)}` : pathname, { scroll: false }), 250);
    return () => clearTimeout(t);
  }, [term, pathname, router]);

  return (
    <Screen className="pb-[calc(max(22px,env(safe-area-inset-bottom))+104px)]">
      {/* Barra superior: Atrás 44 + campo 46 con borde azul de 2 */}
      <div className="flex items-center gap-1.5 pt-[max(48px,env(safe-area-inset-top))] pr-5 pl-2">
        <Link
          href="/mapa"
          aria-label="Volver al mapa"
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-brand-soft/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronLeft className="size-6" strokeWidth={2} aria-hidden />
        </Link>
        <div role="search" className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-chip border-2 border-brand bg-surface px-3.5">
          <Search className="size-[18px] shrink-0 text-ink" strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lugares o beneficios"
            aria-label="Buscar lugares o beneficios"
            autoFocus
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Borrar búsqueda"
              className="-m-1.5 grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full text-text-tertiary hover:bg-brand-soft/60 hover:text-text"
            >
              <X className="size-[18px]" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 px-5 pt-4">
        {results.length > 0 ? (
          <>
            <p aria-live="polite" className="text-caption font-semibold text-text-secondary">
              {results.length} {results.length === 1 ? "lugar" : "lugares"} cerca de {RESIDENCE.label}
            </p>
            <ul className="flex w-full flex-col gap-3">
              {results.map((p) => (
                <li key={p.id}>
                  <ResultCard place={p} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div aria-live="polite" className="flex w-full flex-col items-center gap-2.5 px-2.5 pt-[60px] pb-5 text-center">
            <span aria-hidden className="inline-flex rounded-[40px] bg-brand-soft p-[18px] text-brand">
              <Search className="size-[30px]" strokeWidth={2} />
            </span>
            <p className="max-w-[320px] text-heading font-semibold text-text">No encontramos &quot;{term}&quot; cerca</p>
            <p className="max-w-[320px] text-body text-text-secondary">
              Prueba con otra palabra, como &quot;restaurante&quot; o &quot;comida japonesa&quot;, o quita los filtros.
            </p>
            <Button className="h-[52px]" onClick={() => setQuery("")}>
              Ver todos los lugares
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}

/** Resultado: blanco, radio 18, padding 12, foto 60 radio 12, insignia de beneficio compacta. */
function ResultCard({ place }: { place: NeighborhoodPlace }) {
  const Icon = placeIcons[place.icon];
  return (
    <Link
      href={`/mapa/${place.id}`}
      className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-3 transition-shadow hover:shadow-card outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {place.image ? (
        <Image src={place.image} alt="" width={60} height={60} className="size-[60px] shrink-0 rounded-field object-cover" />
      ) : (
        <span aria-hidden className="grid size-[60px] shrink-0 place-items-center rounded-field bg-brand-soft text-brand">
          <Icon className="size-6" strokeWidth={2} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-body font-semibold text-text">{place.name}</span>
        <span className="text-caption text-text-secondary">
          {formatDistance(place.distanceM)} · {place.recommendations} vecinos lo recomiendan
        </span>
        {place.benefit && (
          <span className="inline-flex items-center gap-[5px] rounded-field bg-success-soft py-[3px] pr-2 pl-1.5 text-overline font-medium text-success">
            <Tag className="size-3" strokeWidth={2} aria-hidden />
            {place.benefit.title}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
    </Link>
  );
}
