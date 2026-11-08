"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { AdminActionBar, Fact, Tag } from "@/components/admin/ui";
import { SectionLabel } from "@/components/perfil/ui";
import { kindLabel, pqrsDate, type Pqrs, type PqrsStatus } from "@/lib/pqrs/data";
import { updatePqrs } from "@/lib/pqrs/actions";
import { pqrsDemoActions, useDemoPqrs } from "@/lib/pqrs/store";
import { StatusStepper, Timeline } from "./ui";

/** Detalle de un reporte. El vecino ve el estado y el historial; la administración, además, lo actualiza. */
export function PqrsDetail({
  id,
  item: serverItem,
  admin = false,
  remote,
}: {
  id: string;
  item?: Pqrs;
  admin?: boolean;
  remote: boolean;
}) {
  const demo = useDemoPqrs();
  const item = serverItem ?? demo?.find((p) => p.id === id);
  const fresh = useSearchParams().get("nuevo") === "1";
  const back = admin ? "/admin/pqrs" : "/pqrs";

  if (!item) {
    if (!serverItem && !demo) return <Screen />;
    return (
      <Screen>
        <ScreenHeader backHref={back} />
        <p className="px-5 pt-6 text-body text-text-tertiary">Este reporte no existe o ya no está disponible.</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader backHref={back} />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-10">
        {fresh && (
          <div role="status" className="flex w-full items-start gap-3 rounded-card bg-status-success-soft px-4 py-3.5">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-status-success" strokeWidth={2} aria-hidden />
            <p className="text-body text-text">
              <span className="font-semibold">Reporte enviado.</span> La administración ya lo tiene y te avisamos cada vez que
              cambie el estado.
            </p>
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={item.kind === "dano" ? "pending" : "brand"}>{kindLabel(item.kind)}</Tag>
            <span className="text-caption text-text-tertiary">{item.number}</span>
          </div>
          <h1 className="text-headline font-bold text-text">{item.title}</h1>
          <p className="text-caption text-text-tertiary">Enviado el {pqrsDate(item.createdAt)}</p>
        </div>

        <StatusStepper item={item} />

        {(item.place || (admin && item.by)) && (
          <div className="flex w-full flex-col gap-2">
            {item.place && <Fact icon={MapPin}>{item.place}</Fact>}
            {admin && item.by && (
              <Fact icon={UserRound}>
                Lo reportó {item.by.name}, {item.by.unit}
              </Fact>
            )}
          </div>
        )}

        {item.description && <p className="w-full text-body text-text">{item.description}</p>}

        {item.photo && (
          <a href={item.photo} target="_blank" rel="noreferrer" className="block w-full overflow-hidden rounded-[18px] border border-option-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photo} alt={`Foto: ${item.title}`} className="max-h-[320px] w-full object-cover" />
          </a>
        )}

        <SectionLabel>Historial</SectionLabel>
        <Timeline item={item} />

        {admin && <AdminUpdate item={item} remote={remote} />}
      </div>
    </Screen>
  );
}

/** Nota para el vecino y botones para cambiar el estado. */
function AdminUpdate({ item, remote }: { item: Pqrs; remote: boolean }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [saving, startSave] = React.useTransition();
  const [pending, setPending] = React.useState<PqrsStatus>();

  function save(status: PqrsStatus) {
    if (status === item.status && !note.trim()) return setError("Escribe una nota para el vecino.");
    setError(undefined);
    setPending(status);
    startSave(async () => {
      if (!remote) {
        pqrsDemoActions.update(item.id, status, note);
      } else {
        const r = await updatePqrs(item.id, status, note);
        if (!r.ok) return setError(r.error);
        router.refresh();
      }
      setNote("");
    });
  }

  const resolved = item.status === "resuelto";

  return (
    <>
      <div className="flex w-full flex-col gap-1.5 pt-2">
        <FormField id="nota" label="Nota para el vecino" hint="Le llega como notificación junto con el nuevo estado.">
          {(aria) => (
            <Textarea
              {...aria}
              boxClassName="min-h-[84px]"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(undefined);
              }}
              placeholder={
                resolved
                  ? "Si lo reabres, cuéntale por qué."
                  : item.status === "recibido"
                    ? "Ya llamamos al electricista. Viene mañana en la mañana."
                    : "Cambiamos la lámpara. Gracias por avisar."
              }
              maxLength={500}
            />
          )}
        </FormField>
      </div>

      <AdminActionBar>
        {error && (
          <p role="alert" className="text-caption text-error">
            {error}
          </p>
        )}
        {resolved ? (
          <Button variant="secondary" onClick={() => save("en_proceso")} disabled={saving}>
            {saving ? "Guardando…" : "Reabrir y marcar en proceso"}
          </Button>
        ) : (
          <>
            <Button onClick={() => save("resuelto")} disabled={saving}>
              {saving && pending === "resuelto" ? "Guardando…" : "Marcar resuelto"}
            </Button>
            <Button variant="secondary" onClick={() => save("en_proceso")} disabled={saving}>
              {saving && pending === "en_proceso"
                ? "Guardando…"
                : item.status === "en_proceso"
                  ? "Enviar nota"
                  : "Marcar en proceso"}
            </Button>
          </>
        )}
      </AdminActionBar>
    </>
  );
}
