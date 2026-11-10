"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, Search, ShieldCheck, Star, X } from "lucide-react";
import { formatRating, initials } from "@/lib/directory/data";
import { cn } from "@/lib/utils";

/* ───────────────────────── Avatar ───────────────────────── */

/** Foto redonda o iniciales sobre #DAE2FD (32, 40, 48 u 88 px). */
export function Avatar({ name, src, size }: { name: string; src?: string; size: 32 | 40 | 48 | 88 }) {
  const text = size >= 88 ? "text-title" : size >= 40 ? "text-caption" : "text-overline";
  return src ? (
    <Image src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand", text)}
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </span>
  );
}

/** Escudo azul de "vecino verificado" (16px). */
export function VerifiedMark() {
  return (
    <>
      <ShieldCheck className="size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
      <span className="sr-only">(identidad verificada)</span>
    </>
  );
}

/**
 * Siempre 5 estrellas, llenas según el puntaje redondeado a la media estrella más cercana:
 * 5 → cinco llenas · 4 → cuatro llenas y una vacía · 3,5 → tres llenas, una a la mitad y una vacía.
 */
export function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span role="img" aria-label={`${formatRating(value)} de 5 estrellas`} className="inline-flex shrink-0 items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rounded - (i - 1)));
        return (
          <span key={i} aria-hidden className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <Star strokeWidth={1.5} className="absolute inset-0 fill-text-tertiary/25 text-transparent" style={{ width: size, height: size }} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star strokeWidth={1.5} className="fill-star text-star" style={{ width: size, height: size }} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** "★★★★★ 5,0 · 28 reseñas de vecinos" */
export function Rating({ rating, label }: { rating: number; label: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-secondary">
      <StarRow value={rating} />
      <span>
        {formatRating(rating)} · {label}
      </span>
    </p>
  );
}

/* ───────────────────────── Chips ───────────────────────── */

/** Chip de filtro de una sola selección (radio 16, padding 6/12, 12/16 SemiBold). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "shrink-0 cursor-pointer rounded-card border px-3 py-1.5 text-overline font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
            value === o.id ? "border-ink bg-ink text-text-on-dark" : "border-border bg-surface text-text hover:border-brand/60",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Chip de formulario (radio 20, padding 8/14, 13/18). Seleccionado: #DAE2FD + borde azul. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  label,
  id,
}: {
  options: { id: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  label: string;
  id?: string;
}) {
  return (
    <div id={id} role="radiogroup" aria-label={label} className="flex w-full flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "cursor-pointer rounded-[20px] border px-3.5 py-2 text-caption font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
            value === o.id ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-text hover:border-brand/60",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Búsqueda (cabecera de D2) ───────────────────────── */

export function SearchBar({
  backHref,
  value,
  onChange,
  placeholder,
}: {
  backHref: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-1.5 pt-[max(48px,env(safe-area-inset-top))] pr-5 pl-2">
      <Link
        href={backHref}
        aria-label="Volver"
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-brand-soft/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ChevronLeft className="size-6" strokeWidth={2} aria-hidden />
      </Link>
      <div role="search" className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-chip border-2 border-brand bg-surface px-3.5">
        <Search className="size-[18px] shrink-0 text-ink" strokeWidth={2} aria-hidden />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              ref.current?.focus();
            }}
            aria-label="Borrar búsqueda"
            className="-m-1.5 grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full text-text-tertiary hover:bg-brand-soft/60 hover:text-text"
          >
            <X className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

/** Botón que finge un buscador y lleva a la pantalla de búsqueda (D1, D8). */
export function SearchLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-[46px] w-full items-center gap-2.5 rounded-chip border border-step-pending bg-surface px-3.5 text-body text-text-tertiary transition-colors hover:border-brand/50 outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <Search className="size-[18px] shrink-0 text-ink" strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}

/* ───────────────────────── Aviso flotante (D12b) ───────────────────────── */

/** Fondo #172033, radio 14, check verde claro; se cierra solo a los 4 s. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[max(32px,env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-[430px] px-5">
      {message && (
        <p className="flex animate-in items-center gap-2.5 rounded-chip bg-toast px-4 py-3 text-label text-white shadow-toast duration-200 fade-in-0 slide-in-from-bottom-2">
          <Check className="size-[18px] shrink-0 text-toast-icon" strokeWidth={2.5} aria-hidden />
          {message}
        </p>
      )}
    </div>
  );
}
