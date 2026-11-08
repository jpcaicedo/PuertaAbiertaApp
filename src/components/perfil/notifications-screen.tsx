"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { useCurrentUser } from "@/components/app/current-user";
import { notifications, type AppNotification } from "@/lib/profile/data";
import { notificationIcon, toneClasses as tone } from "@/lib/notifications/icons";
import type { RemoteNotification } from "@/lib/notifications/types";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/actions";
import { isUnread, profileActions, useProfileState } from "@/lib/profile/store";
import { cn } from "@/lib/utils";
import { ListGroup, SectionLabel } from "./ui";

/** Notificación: icono 20 en caja 38, título 15/22 (SemiBold si no está leída), texto 14/20, tiempo 13/18 y punto azul. */
function NotificationRow({ n, unread, onOpen }: { n: AppNotification; unread: boolean; onOpen?: () => void }) {
  const Icon = n.icon;
  return (
    <li>
      <Link
        href={n.href}
        onClick={onOpen ?? (() => profileActions.markRead(n.id))}
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

/** N1 · Notificaciones (484:5594). Con Supabase recibe las reales en `items`. */
export function NotificationsScreen({ items }: { items?: RemoteNotification[] }) {
  const state = useProfileState();
  const user = useCurrentUser();
  const [readNow, setReadNow] = React.useState<string[]>([]);
  const [, startMarkAll] = React.useTransition();

  const remote = items?.map(
    (n): AppNotification => ({ ...n, icon: notificationIcon(n), unread: n.unread && !readNow.includes(n.id) }),
  );
  const list = remote ?? notifications;
  const unreadOf = (n: AppNotification) => (remote ? n.unread : isUnread(state, n.id));
  const fresh = list.filter(unreadOf);
  const before = list.filter((n) => !unreadOf(n));
  const open = (n: AppNotification) => () => {
    if (!remote) return profileActions.markRead(n.id);
    setReadNow((r) => [...r, n.id]);
    void markNotificationRead(n.id);
  };

  return (
    <Screen>
      <ScreenHeader backHref={user.role === "administracion" ? "/admin" : "/inicio"} />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <div className="flex w-full items-center justify-between gap-3">
          <h1 className="text-headline font-bold text-text">Notificaciones</h1>
          {remote && fresh.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setReadNow(fresh.map((n) => n.id));
                startMarkAll(() => markAllNotificationsRead());
              }}
              className="cursor-pointer rounded-md px-1 text-caption font-semibold text-brand hover:underline outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {list.length === 0 && (
          <div className="flex w-full flex-col items-center gap-2.5 px-2.5 pt-12 text-center">
            <span aria-hidden className="inline-flex rounded-[40px] bg-brand-soft p-[18px] text-brand">
              <Bell className="size-8" strokeWidth={2} />
            </span>
            <p className="text-heading font-semibold text-text">Todavía no tienes notificaciones</p>
            <p className="max-w-[310px] text-body text-text-secondary">
              Aquí te avisamos de los avisos de la administración, las respuestas a tus solicitudes y los mensajes de tus
              vecinos.
            </p>
          </div>
        )}

        {fresh.length > 0 && (
          <>
            <SectionLabel>Nuevas</SectionLabel>
            <ListGroup label="Nuevas">
              {fresh.map((n) => (
                <NotificationRow key={n.id} n={n} unread onOpen={open(n)} />
              ))}
            </ListGroup>
          </>
        )}

        {before.length > 0 && (
          <>
            <SectionLabel>{fresh.length ? "Antes" : "Todas leídas"}</SectionLabel>
            <ListGroup label="Antes">
              {before.map((n) => (
                <NotificationRow key={n.id} n={n} unread={false} onOpen={open(n)} />
              ))}
            </ListGroup>
          </>
        )}
      </div>
    </Screen>
  );
}
