"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageCircle } from "lucide-react";
import { subscribeToChanges } from "@/lib/supabase/realtime";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useCurrentUser, UserAvatar } from "./current-user";

type HomeHeaderProps = {
  /** Muestra un punto rojo sobre la campana. Con Supabase se calcula solo. */
  hasUnread?: boolean;
};

const iconButton =
  "relative -m-2 grid size-[38px] place-items-center rounded-full text-ink transition-colors hover:bg-brand-soft/60 outline-none focus-visible:ring-2 focus-visible:ring-brand";

/**
 * Encabezado de Inicio (Figma "Encabezado", 476:955): alto 64, padding 20.
 * Avatar 36 + nombre 15/22 SemiBold azul + unidad 12/16 Medium.
 * A la derecha: Mensajes (con el número sin leer), campana y logo 42×28, gap 14.
 */
export function HomeHeader({ hasUnread: forced }: HomeHeaderProps) {
  const user = useCurrentUser();
  const [live, setLive] = React.useState(false);
  const hasUnread = forced ?? (live || (user.unreadNotifications ?? 0) > 0);

  // Mensajes sin leer: el número viene del servidor y sube en vivo con cada mensaje nuevo.
  // Cuando el servidor manda un número nuevo (por ejemplo, al leer un chat), se vuelve a contar desde ahí.
  const serverMessages = user.unreadMessages ?? 0;
  const [newMessages, setNewMessages] = React.useState(0);
  const pathname = usePathname();
  const inMessages = React.useRef(false);
  inMessages.current = pathname.startsWith("/mensajes");
  React.useEffect(() => setNewMessages(0), [serverMessages, pathname]);
  const unreadMessages = serverMessages + newMessages;

  // Punto rojo y número en vivo: Supabase avisa cuando llega una notificación o un mensaje nuevo.
  const userId = user.id;
  React.useEffect(() => {
    if (!isSupabaseConfigured || userId === "demo") return;
    return subscribeToChanges(`campana-${userId}`, (channel) =>
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notificaciones", filter: `perfil_id=eq.${userId}` },
          () => setLive(true),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "mensajes", filter: `para=eq.${userId}` },
          // Dentro de Mensajes ya se están leyendo: no se suman.
          () => {
            if (!inMessages.current) setNewMessages((n) => n + 1);
          },
        ),
    );
  }, [userId]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-5">
      <Link href="/perfil" className="flex min-w-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <UserAvatar user={user} size={36} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body font-semibold text-brand">{user.firstName}</span>
          <span className="truncate text-overline font-medium text-text-secondary">{user.unitLabel}</span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-3.5">
        <Link
          href="/mensajes"
          aria-label={
            unreadMessages
              ? `Mensajes, ${unreadMessages} sin leer`
              : "Mensajes"
          }
          className={iconButton}
        >
          <MessageCircle className="size-[22px]" strokeWidth={2} aria-hidden />
          {unreadMessages > 0 && (
            <span
              aria-hidden
              className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-error px-1 text-[11px] leading-none font-bold text-white ring-2 ring-bg"
            >
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Link>
        <Link
          href="/notificaciones"
          aria-label={hasUnread ? "Notificaciones, tienes nuevas" : "Notificaciones"}
          className={iconButton}
        >
          <Bell className="size-[22px]" strokeWidth={2} aria-hidden />
          {hasUnread && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-error ring-2 ring-bg" />}
        </Link>
        {/* Logo a color en modo claro y blanco en modo oscuro (solo CSS, sin parpadeo al cargar). */}
        <Image src="/images/logo-skema.svg" alt="Skema" width={42} height={28} unoptimized className="h-7 w-[42px] object-contain dark:hidden" />
        <Image src="/images/logo-skema-blanco.png" alt="Skema" width={42} height={28} unoptimized className="hidden h-7 w-[42px] object-contain dark:block" />
      </div>
    </header>
  );
}
