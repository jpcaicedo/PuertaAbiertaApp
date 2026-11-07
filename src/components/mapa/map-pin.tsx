"use client";

import type { NeighborhoodPlace } from "@/lib/places/data";
import { cn } from "@/lib/utils";
import { placeIcons } from "./icons";

/**
 * Pin: blanco, radio 20, padding 6/12/6/6, sombra 0 4 14 / 14 %; tile #DAE2FD de 26 con icono 16.
 * Seleccionado: fondo #FD9200, tile blanco, texto 13/18 marrón y el beneficio al lado (Figma "Pin · Café Samán").
 * Se usa igual en el plano ilustrado y como contenido de un <Marker> de Mapbox.
 */
export function MapPin({
  place,
  selected,
  onSelect,
  compact = false,
}: {
  place: NeighborhoodPlace;
  selected: boolean;
  onSelect: () => void;
  /** Solo el icono (zoom lejano en Mapbox), para que los pines no se tapen entre sí. */
  compact?: boolean;
}) {
  const Icon = placeIcons[place.icon];
  return (
    <button
      type="button"
      onClick={(e) => {
        // Evita que el clic llegue al mapa (que deselecciona al tocar el fondo).
        e.stopPropagation();
        onSelect();
      }}
      aria-pressed={selected}
      aria-label={`${place.name}${place.benefit ? `, ${place.benefit.title}` : ""}`}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-[20px] py-1.5 pl-1.5 whitespace-nowrap shadow-[0_4px_14px_rgb(0_0_0/0.14)] transition-[transform,background-color] duration-150 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand",
        compact ? "pr-1.5" : "pr-3",
        selected ? "bg-step-current" : "bg-surface hover:-translate-y-0.5",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex rounded-chip p-[5px]",
          selected ? "bg-surface text-warning" : "bg-brand-soft text-brand",
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      {!compact && (
        <span
          aria-hidden
          className={
            selected
              ? "text-caption font-semibold text-warning"
              : "text-overline font-semibold text-text"
          }
        >
          {place.pinLabel}
          {selected && place.benefit ? ` · ${place.benefit.short}` : ""}
        </span>
      )}
    </button>
  );
}

/** "Tú estás aquí": punto azul de 22 con halo + etiqueta negra. */
export function ResidencePin({ label }: { label: string }) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-1.5">
      <span
        aria-hidden
        className="size-[22px] rounded-full border-4 border-white bg-brand shadow-[0_0_0_10px_rgb(1_75_163/0.15)]"
      />
      <span className="rounded-field bg-ink px-2.5 py-1 text-overline font-medium whitespace-nowrap text-text-on-dark">
        {label}
      </span>
    </div>
  );
}
