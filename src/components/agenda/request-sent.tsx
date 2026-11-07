"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions } from "@/components/app/screen";
import { draftDate, draftQuery, type DraftActivity } from "@/lib/agenda/draft";
import { cn } from "@/lib/utils";
import { StatusCircle } from "./primitives";

type Step = { label: string; state: "done" | "current" | "pending" };

/** Paso: círculo 24 (verde con check / naranja / gris) + texto 15/22. */
function StepRow({ label, state }: Step) {
  return (
    <li className="flex items-center gap-3" aria-current={state === "current" ? "step" : undefined}>
      <span
        aria-hidden
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          state === "done" ? "bg-success text-white" : state === "current" ? "bg-step-current" : "bg-step-pending",
        )}
      >
        {state === "done" && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span
        className={cn(
          "text-body",
          state === "current" ? "font-semibold text-text" : state === "done" ? "text-text" : "text-text-tertiary",
        )}
      >
        {label}
        <span className="sr-only">{state === "done" ? " (completado)" : state === "current" ? " (en curso)" : " (pendiente)"}</span>
      </span>
    </li>
  );
}

/** A7 · Solicitud enviada, con la notificación de aprobación simulada a los pocos segundos. */
export function RequestSent({ draft }: { draft: DraftActivity }) {
  const [approved, setApproved] = React.useState(false);

  // TODO: reemplazar por la notificación push real cuando la administración apruebe.
  React.useEffect(() => {
    const t = setTimeout(() => setApproved(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const steps: Step[] = [
    { label: "Solicitud enviada", state: "done" },
    { label: "Revisión de la administración", state: "current" },
    { label: "Publicada en la Agenda", state: "pending" },
  ];

  return (
    <Screen>
      {/* Notificación de aprobación: 366 de ancho, radio 18, sombra 0 8 24 / 15 % */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(44px,env(safe-area-inset-top))] z-40 mx-auto w-full max-w-[430px] px-3">
        {approved && (
          <Link
            href={`/agenda/crear/publicada?${draftQuery(draft, { aprobada: "1" })}`}
            className="pointer-events-auto flex w-full animate-in items-center gap-3 rounded-[18px] bg-surface px-3.5 py-3 shadow-toast duration-300 fade-in-0 slide-in-from-top-4 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span aria-hidden className="inline-flex shrink-0 rounded-field bg-success-soft p-2 text-success">
              <Bell className="size-5" strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-overline font-medium text-text-tertiary">Puerta Abierta · ahora</span>
              <span className="text-caption font-semibold text-text">La administración aprobó tu actividad. Toca para verla.</span>
            </span>
          </Link>
        )}
      </div>

      <div className="flex flex-col items-start gap-4 px-5 pt-[180px]">
        <StatusCircle icon={Clock} tone="warning" />
        <h1 className="text-title font-bold text-text">Solicitud enviada a la administración</h1>
        <p className="text-body font-semibold text-text">
          {draft.name} · {draftDate(draft)} · {draft.place}
        </p>
        <ol className="flex w-full flex-col gap-3.5 rounded-[18px] bg-surface p-4">
          {steps.map((s) => (
            <StepRow key={s.label} {...s} />
          ))}
        </ol>
        <p className="text-caption text-text-secondary">
          Si la administración propone otra fecha o lugar, te avisamos para que ajustes tu actividad.
        </p>
      </div>

      <ScreenActions>
        <Button asChild className="rounded-[80px]">
          <Link href="/agenda">Volver a la agenda</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}
