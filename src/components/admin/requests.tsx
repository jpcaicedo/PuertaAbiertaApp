"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, ChevronRight, CircleCheck, Clock, MapPin, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { FormField } from "@/components/app/form-field";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { Avatar } from "@/components/directorio/ui";
import { PageHeading } from "@/components/perfil/ui";
import {
  adminRequests,
  requestKindLabel,
  type AdminRequest,
  type RequestKind,
} from "@/lib/admin/data";
import { adminActions, useAdminState } from "@/lib/admin/store";
import { decideRequest } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";
import { AdminActionBar, Fact, Tag } from "./ui";

export type RequestFilter = "todas" | "actividades" | "reservas";
const filterKind: Record<RequestFilter, RequestKind | null> = {
  todas: null,
  actividades: "activity",
  reservas: "reservation",
};

/** Tarjeta de X2: etiqueta + tiempo, título 18/24, lugar y quién, y «Revisar solicitud». */
function RequestCard({ r }: { r: AdminRequest }) {
  return (
    <li>
      <Link
        href={`/admin/solicitudes/${r.id}`}
        className="flex w-full flex-col items-start gap-3 rounded-[18px] border border-option-border bg-surface p-4 transition-colors hover:bg-surface-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span className="flex w-full items-center gap-2">
          <Tag tone={r.kind === "activity" ? "brand" : "neutral"}>{requestKindLabel[r.kind]}</Tag>
          <span className="flex-1" />
          {r.overdue ? (
            <Tag tone="pending">{r.age}</Tag>
          ) : (
            <span className="text-caption text-text-muted">{r.age}</span>
          )}
        </span>
        <span className="text-heading font-bold text-text">{r.title}</span>
        <Fact icon={MapPin}>{r.summary}</Fact>
        <Fact icon={User}>
          {r.verb} {r.by.name}, Torre {r.by.tower}
        </Fact>
        <span className="flex items-center gap-1.5 pt-1 text-body font-semibold text-brand">
          Revisar solicitud
          <ChevronRight className="size-[18px]" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}

/** X2 · Solicitudes (484:5713) */
export function RequestsScreen({ filter, requests }: { filter: RequestFilter; requests?: AdminRequest[] }) {
  const state = useAdminState();
  // Con Supabase llegan solo las pendientes; en modo demo se filtran las decididas en el navegador.
  const pending = requests ?? adminRequests.filter((r) => !state.decisions[r.id]);
  const count = (k: RequestKind | null) => pending.filter((r) => !k || r.kind === k).length;
  const visible = pending.filter((r) => !filterKind[filter] || r.kind === filterKind[filter]);

  const chips: { id: RequestFilter; label: string }[] = [
    { id: "todas", label: `Todas (${count(null)})` },
    { id: "actividades", label: `Actividades (${count("activity")})` },
    { id: "reservas", label: `Reservas (${count("reservation")})` },
  ];

  return (
    <Screen>
      <ScreenHeader backHref="/admin" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <PageHeading
          title="Solicitudes"
          description="Responde en menos de 24 horas para que los vecinos puedan organizarse."
        />
        <nav aria-label="Filtrar solicitudes" className="flex gap-2">
          {chips.map((c) => (
            <Link
              key={c.id}
              href={c.id === "todas" ? "/admin/solicitudes" : `/admin/solicitudes?tipo=${c.id}`}
              replace
              scroll={false}
              aria-current={filter === c.id ? "page" : undefined}
              className={cn(
                "rounded-[18px] border px-3.5 py-[7px] text-label font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
                filter === c.id
                  ? "border-text bg-text text-text-on-dark"
                  : "border-option-border bg-surface text-text hover:border-brand/40",
              )}
            >
              {c.label}
            </Link>
          ))}
        </nav>
        {visible.length ? (
          <ul className="flex w-full flex-col gap-4">
            {visible.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </ul>
        ) : (
          <div className="flex w-full flex-col items-center gap-2 px-2.5 pt-12 text-center">
            <CircleCheck className="size-10 text-status-success" strokeWidth={1.75} aria-hidden />
            <p className="text-callout font-semibold text-text">No hay solicitudes pendientes</p>
            <p className="text-label text-text-tertiary">
              Cuando un vecino proponga un plan o pida una zona, aparece aquí.
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}

/* ───────────────────────── X3 · Revisar solicitud ───────────────────────── */

type SheetKind = "propose" | "reject" | null;

/** Hoja para proponer otra fecha o rechazar: un mensaje obligatorio que le llega al vecino. */
function DecisionSheet({
  kind,
  r,
  onOpenChange,
  onConfirm,
}: {
  kind: SheetKind;
  r: AdminRequest;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
}) {
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string>();
  const propose = kind === "propose";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError(propose ? "Escribe qué fecha u hora propones." : "Cuéntale al vecino por qué.");
      return;
    }
    onConfirm(message.trim());
  }

  return (
    <BottomSheet open={kind !== null} onOpenChange={onOpenChange}>
      <BottomSheetContent className="gap-3.5 pt-6 pb-[max(36px,env(safe-area-inset-bottom))]">
        <BottomSheetTitle className="text-title font-bold">
          {propose ? "Proponer otra fecha" : "Rechazar solicitud"}
        </BottomSheetTitle>
        <BottomSheetDescription>
          {propose
            ? `${r.by.name} recibe tu propuesta y decide si la acepta.`
            : `${r.by.name} recibe el motivo. Sé claro y amable.`}
        </BottomSheetDescription>
        <form onSubmit={submit} noValidate className="flex w-full flex-col gap-3.5">
          <FormField id="mensaje-decision" label={propose ? "Tu propuesta" : "Motivo"} error={error}>
            {(aria) => (
              <Textarea
                {...aria}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  propose
                    ? "El salón está libre el domingo 18 de 3:00 a 6:00 p. m."
                    : "Ese día hay mantenimiento en la zona."
                }
                maxLength={280}
              />
            )}
          </FormField>
          <Button type="submit">{propose ? "Enviar propuesta" : "Rechazar solicitud"}</Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

/** X3 · Revisar solicitud (484:5799) → X4 */
export function ReviewRequest({ request: r, remote }: { request: AdminRequest; remote: boolean }) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<SheetKind>(null);
  const [sheetKey, setSheetKey] = React.useState(0);
  const [error, setError] = React.useState<string>();
  const [saving, startSave] = React.useTransition();

  function open(kind: Exclude<SheetKind, null>) {
    setSheetKey((k) => k + 1);
    setSheet(kind);
  }

  function decide(decision: "approved" | "rejected" | "proposed", message?: string) {
    const next = decision === "approved" ? `/admin/solicitudes/${r.id}/aprobada` : "/admin/solicitudes";
    if (!remote) {
      // Modo demo: la decisión queda en el navegador.
      adminActions.decide(r.id, decision);
      return router.push(next);
    }
    setError(undefined);
    startSave(async () => {
      const result = await decideRequest(r.id, decision, message);
      setSheet(null);
      if (!result.ok) return setError(result.error);
      router.push(next);
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref="/admin/solicitudes" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3">
        <div className="flex w-full flex-col items-start gap-2 pb-1">
          <Tag tone={r.kind === "activity" ? "brand" : "neutral"}>{requestKindLabel[r.kind]}</Tag>
          <h1 className="text-headline font-bold text-text">{r.title}</h1>
        </div>

        {/* Quién propone */}
        <section
          aria-label="Quién lo pide"
          className="flex w-full items-center gap-3 rounded-[18px] border border-option-border bg-surface p-4"
        >
          {r.by.avatar ? (
            <Image
              src={r.by.avatar}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Avatar name={r.by.name} size={40} />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-callout font-semibold text-text">
              {r.by.name}, Torre {r.by.tower}
            </p>
            <p className="flex items-center gap-1.5 text-caption text-status-success">
              <Award className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {r.history}
            </p>
          </div>
        </section>

        {/* Detalle */}
        <section
          aria-label="Detalle"
          className="flex w-full flex-col gap-2.5 rounded-[18px] border border-option-border bg-surface p-4"
        >
          <Fact icon={MapPin}>{r.place}</Fact>
          <Fact icon={Clock}>{r.when}</Fact>
          <Fact icon={Users}>{r.capacity}</Fact>
          <div className="flex w-full flex-col gap-1 rounded-chip bg-surface-muted px-3.5 py-3">
            <p className="text-caption font-semibold text-text-tertiary">Mensaje de {r.by.name}</p>
            <p className="text-body text-text">{r.message}</p>
          </div>
        </section>

        {/* Verificación automática */}
        <ul
          aria-label="Verificación"
          className="flex w-full flex-col gap-2 rounded-card bg-status-success-soft px-4 py-3.5"
        >
          {r.checks.map((c) => (
            <li key={c} className="flex items-start gap-2 text-label font-medium text-status-success">
              <CircleCheck className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <AdminActionBar>
        {error && (
          <p role="alert" className="text-caption text-error">
            {error}
          </p>
        )}
        <Button onClick={() => decide("approved")} disabled={saving}>
          {saving ? "Guardando…" : "Aprobar"}
        </Button>
        <div className="flex w-full gap-2">
          <Button variant="secondary" className="min-w-0 flex-1" onClick={() => open("propose")}>
            Proponer otra fecha
          </Button>
          <Button variant="link" className="w-[110px] shrink-0" onClick={() => open("reject")}>
            Rechazar
          </Button>
        </div>
      </AdminActionBar>

      <DecisionSheet
        key={sheetKey}
        kind={sheet}
        r={r}
        onOpenChange={(o) => !o && setSheet(null)}
        onConfirm={(message) => decide(sheet === "propose" ? "proposed" : "rejected", message)}
      />
    </Screen>
  );
}
