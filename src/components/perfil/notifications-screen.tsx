"use client";

import Link from "next/link";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { notifications, type AppNotification, type NotificationTone } from "@/lib/profile/data";
import { isUnread, profileActions, useProfileState } from "@/lib/profile/store";
import { cn } from "@/lib/utils";
import { ListGroup, SectionLabel } from "./ui";

const tone: Record<NotificationTone, string> = {
  success: "bg-status-success-soft text-status-success",
  brand: "bg-option-blue text-brand",
  warm: "bg-option-orange text-illustration-ink",
  neutral: "bg-surface-muted text-text",
};

/** Notificación: icono 20 en caja 38, título 15/22 (SemiBold si no está leída), texto 14/20, tiempo 13/18 y punto azul. */
function NotificationRow({ n, unread }: { n: AppNotification; unread: boolean }) {
  const Icon = n.icon;
  return (
    <li>
      <Link
        href={n.href}
        onClick={() => profileActions.markRead(n.id)}
        className={cn(
          "flex w-full items-start gap-3.5 py-3.5 pr-4 pl-3.5 text-left transition-colors hover:bg-surface-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
          unread && "bg-unread",
        )}
      >
        <span aria-hidden className={cn("inline-flex shrink-0 rounded-field p-[9px]", tone[n.tone])}>
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn("text-body text-text", unread ? "font-semibold" : "font-medium")}>
            {unread && <span className="sr-only">Sin leer: </span>}
            {n.title}
          </span>
          <span className="text-label text-text-tertiary">{n.body}</span>
          <span className="text-caption text-text-muted">{n.when}</span>
        </span>
        {unread && (
          <span aria-hidden className="grid h-4 w-[9px] shrink-0 place-items-center pt-1.5">
            <span className="size-2 rounded-full bg-brand" />
          </span>
        )}
      </Link>
    </li>
  );
}

/** N1 · Notificaciones (484:5594) */
export function NotificationsScreen() {
  const state = useProfileState();
  const fresh = notifications.filter((n) => isUnread(state, n.id));
  const before = notifications.filter((n) => !isUnread(state, n.id));

  return (
    <Screen>
      <ScreenHeader backHref="/inicio" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <h1 className="text-headline font-bold text-text">Notificaciones</h1>

        {fresh.length > 0 && (
          <>
            <SectionLabel>Nuevas</SectionLabel>
            <ListGroup label="Nuevas">
              {fresh.map((n) => (
                <NotificationRow key={n.id} n={n} unread />
              ))}
            </ListGroup>
          </>
        )}

        {before.length > 0 && (
          <>
            <SectionLabel>{fresh.length ? "Antes" : "Todas leídas"}</SectionLabel>
            <ListGroup label="Antes">
              {before.map((n) => (
                <NotificationRow key={n.id} n={n} unread={false} />
              ))}
            </ListGroup>
          </>
        )}
      </div>
    </Screen>
  );
}
