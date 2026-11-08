"use client";

import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions } from "@/components/app/screen";
import { PushNotification } from "@/components/app/push-notification";
import { draftDate, draftQuery, type DraftActivity } from "@/lib/agenda/draft";
import { cn } from "@/lib/utils";
import { StatusCircle } from "./primitives";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
        <span className="sr-only">
          {state === "done" ? " (completado)" : state === "current" ? " (en curso)" : " (pendiente)"}
        </span>
      </span>
    </li>
  );
}

/** A7 · Solicitud enviada, con la notificación de aprobación simulada a los pocos segundos. */
export function RequestSent({ draft }: { draft: DraftActivity }) {
  const steps: Step[] = [
    { label: "Solicitud enviada", state: "done" },
    { label: "Revisión de la administración", state: "current" },
    { label: "Publicada en la Agenda", state: "pending" },
  ];

  return (
    <Screen>
      {/* Modo demo: aprobación simulada. Con Supabase la decide la administración. */}
      {!isSupabaseConfigured && (
        <PushNotification href={`/agenda/crear/publicada?${draftQuery(draft, { aprobada: "1" })}`}>
          La administración aprobó tu actividad. Toca para verla.
        </PushNotification>
      )}

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
