"use client";

import Link from "next/link";
import { Bell, Building2, ChevronRight, Flag, Megaphone, Wrench, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/app/screen";
import { ListGroup, NavRow, PageHeading, SectionLabel } from "@/components/perfil/ui";
import { community } from "@/lib/mock-data";
import { activeNotices, adminRequests, reports, type AdminNotice, type AdminRequest, type Report } from "@/lib/admin/data";
import { useAdminState } from "@/lib/admin/store";
import { useDemoPqrs } from "@/lib/pqrs/store";
import { useCurrentUser } from "@/components/app/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import { Tag } from "./ui";

/** Tarjeta de resumen: icono 18 en caja 10, número 22/28 y texto 14/20. */
function SummaryCard({
  href,
  icon: Icon,
  tone,
  value,
  label,
}: {
  href: string;
  icon: LucideIcon;
  tone: "warm" | "brand";
  value: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-1 flex-col items-start gap-2.5 rounded-[18px] border border-option-border bg-surface p-3.5 transition-colors hover:bg-surface-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex rounded-[10px] p-2",
          tone === "warm" ? "bg-option-orange text-status-pending" : "bg-option-blue text-brand",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <span className="text-title font-bold text-text">{value}</span>
      <span className="text-label text-text-tertiary">{label}</span>
    </Link>
  );
}

/** X1 · Inicio de la administración (484:5658) */
export function AdminHome({
  notices: serverNotices,
  requests,
  openReports: serverReports,
  openPqrs: serverPqrs,
}: {
  notices?: AdminNotice[];
  requests?: AdminRequest[];
  openReports?: Report[];
  openPqrs?: number;
}) {
  const state = useAdminState();
  const user = useCurrentUser();
  const unread = user.unreadNotifications ?? 0;
  const pending = requests ?? adminRequests.filter((r) => !state.decisions[r.id]);
  const oldest = Math.max(0, ...pending.map((r) => r.waitingHours));
  const openReports = serverReports ?? reports.filter((r) => !state.reports[r.id]);
  // Con Supabase llegan de la base de datos; en modo demo, los de ejemplo más los publicados en el navegador.
  const notices = serverNotices ?? [...state.notices, ...activeNotices];
  const demoPqrs = useDemoPqrs();
  const openPqrs = serverPqrs ?? demoPqrs?.filter((p) => p.status !== "resuelto").length ?? 0;

  return (
    <Screen className="pb-tabbar">
      {/* Encabezado: 64 de alto a 40 del borde */}
      <header className="mt-[max(40px,env(safe-area-inset-top))] flex h-16 shrink-0 items-center gap-3 px-5">
        <span aria-hidden className="inline-flex rounded-field bg-brand p-[9px] text-white">
          <Building2 className="size-5" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-callout font-semibold text-text">Administración</span>
          <span className="text-caption text-text-tertiary">{community.name}</span>
        </span>
        <Link
          href={isSupabaseConfigured ? "/notificaciones" : "/admin/solicitudes"}
          aria-label={
            isSupabaseConfigured
              ? unread
                ? `Notificaciones, ${unread} sin leer`
                : "Notificaciones"
              : `Solicitudes pendientes: ${pending.length}`
          }
          className="relative -m-2 grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-brand-soft/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Bell className="size-6" strokeWidth={2} aria-hidden />
          {unread > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-error ring-2 ring-bg" />}
        </Link>
      </header>

      <div className="flex flex-col items-start gap-4 px-5 pt-3">
        <PageHeading title="Hoy en el conjunto" description="Lo que necesita tu respuesta." />

        {/* Pendientes */}
        <section className="flex w-full flex-col items-start gap-1.5 rounded-panel bg-brand p-[18px] text-white">
          {pending.length ? (
            <>
              <h2 className="text-title font-bold">
                {pending.length} {pending.length === 1 ? "solicitud" : "solicitudes"} por revisar
              </h2>
              <p className="text-body text-white/85">
                {oldest > 0
                  ? `La más antigua lleva ${oldest} ${oldest === 1 ? "hora" : "horas"}. `
                  : "Todas llegaron hace poco. "}
                Los vecinos esperan respuesta en menos de 24.
              </p>
              <Link
                href="/admin/solicitudes"
                className="mt-3.5 inline-flex items-center gap-2 rounded-[24px] bg-surface px-[18px] py-3 text-body font-semibold text-brand transition-colors hover:bg-brand-soft outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
              >
                Revisar solicitudes
                <ChevronRight className="size-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-title font-bold">Estás al día</h2>
              <p className="text-body text-white/85">No hay solicitudes por revisar. Te avisamos cuando llegue una.</p>
            </>
          )}
        </section>

        <div className="flex w-full gap-3">
          <SummaryCard
            href={openReports[0] ? `/admin/reportes/${openReports[0].id}` : "/admin"}
            icon={Flag}
            tone="warm"
            value={openReports.length}
            label={openReports.length === 1 ? "Reporte por revisar" : "Reportes por revisar"}
          />
          <SummaryCard
            href="#ultimos-avisos"
            icon={Megaphone}
            tone="brand"
            value={notices.length}
            label="Avisos activos"
          />
        </div>

        <ListGroup label="Reportes y PQRS">
          <NavRow
            href="/admin/pqrs"
            icon={Wrench}
            title="Reportes y PQRS"
            subtitle={
              openPqrs
                ? `${openPqrs} ${openPqrs === 1 ? "abierto" : "abiertos"} · daños, peticiones y quejas`
                : "Sin reportes abiertos"
            }
          />
        </ListGroup>

        <Button asChild className="w-full">
          <Link href="/admin/avisos/nuevo">Publicar aviso</Link>
        </Button>

        <SectionLabel id="ultimos-avisos">Últimos avisos</SectionLabel>
        <ListGroup label="Últimos avisos">
          {notices.map((n) => (
            <li key={n.id} className="flex flex-col items-start gap-1.5 px-4 py-3.5">
              <p className="text-callout font-semibold text-text">{n.title}</p>
              <p className="text-label text-text-tertiary">{n.when}</p>
              <Tag tone={n.shareable ? "success" : "neutral"}>
                {n.shareable ? "Se puede compartir" : "Solo residentes"}
              </Tag>
            </li>
          ))}
        </ListGroup>
      </div>
    </Screen>
  );
}
