"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRating, reviewsLabel, withRealRatings, type Review } from "@/lib/directory/data";
import { useDemoReview } from "@/lib/directory/reviews-store";
import type { ReviewAccess } from "@/lib/directory/queries";
import { useCurrentUser } from "@/components/app/current-user";
import { cn } from "@/lib/utils";
import { Avatar, Rating } from "./ui";

/* ───────────────────────── Estrellas ───────────────────────── */

/** Fila de 5 estrellas de solo lectura. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={1.5}
          style={{ width: size, height: size }}
          className={i <= value ? "fill-star text-star" : "fill-transparent text-border"}
        />
      ))}
    </span>
  );
}

const starWords = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

/** Selector de 1 a 5 estrellas (radio group accesible con flechas). */
export function StarPicker({ value, onChange, id }: { value: number; onChange: (v: number) => void; id?: string }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  function key(e: React.KeyboardEvent, i: number) {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? i - 1 : 0;
    if (!next || next < 1 || next > 5) return;
    e.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div id={id} role="radiogroup" aria-label="Calificación" className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}, ${starWords[i].toLowerCase()}`}
            tabIndex={value ? (value === i ? 0 : -1) : i === 1 ? 0 : -1}
            onClick={() => onChange(i)}
            onKeyDown={(e) => key(e, i)}
            className="grid size-12 cursor-pointer place-items-center rounded-full transition-transform active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Star
              aria-hidden
              strokeWidth={1.5}
              className={cn("size-9", i <= value ? "fill-star text-star" : "fill-transparent text-border")}
            />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="h-5 text-label font-semibold text-text">
        {value ? starWords[value] : ""}
      </p>
    </div>
  );
}

/* ───────────────────────── Línea de calificación ───────────────────────── */

/** "★ 4,9 · 12 reseñas de vecinos". En modo demo suma mi reseña guardada en el navegador. */
export function ServiceRating({
  slug,
  rating,
  count,
  remote,
}: {
  slug: string;
  rating?: number;
  count: number;
  remote: boolean;
}) {
  const demo = useDemoReview(slug);
  const s = !remote && demo ? withRealRatings({ rating, reviewCount: count }, [demo.stars]) : { rating, reviewCount: count };
  if (!s.rating) return null;
  return <Rating value={formatRating(s.rating)} label={reviewsLabel(s.reviewCount, true)} />;
}

/* ───────────────────────── Sección de reseñas ───────────────────────── */

function reviewDate(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "America/Bogota",
  })
    .format(d)
    .replace(".", "")
    .replace(/ de /g, " ");
}

/** Reseñas de vecinos (reales arriba, de ejemplo abajo) y el botón para dejar o editar la mía. */
export function ServiceReviews({
  slug,
  firstName,
  real,
  samples,
  hasMine,
  access,
  isMine,
  remote,
}: {
  slug: string;
  firstName: string;
  real: Review[];
  samples: Review[];
  hasMine: boolean;
  access: ReviewAccess;
  isMine: boolean;
  remote: boolean;
}) {
  const user = useCurrentUser();
  const demo = useDemoReview(slug);
  const mineDemo: Review | undefined =
    !remote && demo
      ? {
          name: user.firstName,
          fullName: user.fullName,
          tower: user.tower,
          avatar: user.avatar ?? undefined,
          text: demo.text,
          stars: demo.stars,
          date: demo.date,
          mine: true,
        }
      : undefined;
  const reviews = [...(mineDemo ? [mineDemo] : []), ...real, ...samples];
  const mine = remote ? hasMine : !!demo;
  const canReview = !isMine && access === "si";

  return (
    <section aria-labelledby="resenas-titulo" id="resenas" className="flex w-full scroll-mt-4 flex-col gap-2.5">
      <h2 id="resenas-titulo" className="text-body font-semibold text-text">
        Reseñas de vecinos
      </h2>

      {canReview && !mine && (
        <div className="flex w-full flex-col items-start gap-2 rounded-card bg-option-blue p-3.5">
          <p className="text-caption text-text">¿Ya contrataste a {firstName}? Cuéntales a tus vecinos cómo te fue.</p>
          <Button asChild className="h-10 w-auto rounded-[80px] px-4 text-label">
            <Link href={`/directorio/${slug}/resena`}>
              <Star className="fill-current" strokeWidth={1.5} aria-hidden />
              Dejar reseña
            </Link>
          </Button>
        </div>
      )}
      {!isMine && access === "sin_contacto" && (
        <p className="flex items-start gap-2 text-caption text-text-secondary">
          <MessageCircle className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden />
          Cuando le escribas a {firstName} por la app y lo contrates, podrás dejarle una reseña.
        </p>
      )}

      {reviews.length === 0 && (
        <p className="text-caption text-text-secondary">
          {isMine ? "Todavía no tienes reseñas. Aparecen aquí cuando un vecino te califique." : "Todavía no tiene reseñas."}
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {reviews.map((r, i) => (
          <li key={`${r.name}-${r.date ?? i}`} className="flex items-start gap-2.5 rounded-card bg-surface p-3">
            <Avatar name={r.fullName} src={r.avatar} size={32} />
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-caption">
              <p className="font-semibold text-text">
                {r.mine ? "Tu reseña" : r.name}
                {r.tower && !r.mine ? ` · Torre ${r.tower}` : ""}
              </p>
              {r.stars && (
                <p className="flex items-center gap-2">
                  <Stars value={r.stars} />
                  {r.date && <span className="text-overline text-text-tertiary">{reviewDate(r.date)}</span>}
                </p>
              )}
              {r.text && <p className="text-text-secondary">{r.text}</p>}
              {r.mine && (
                <Link
                  href={`/directorio/${slug}/resena`}
                  className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm font-semibold text-brand outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
                  Editar
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
