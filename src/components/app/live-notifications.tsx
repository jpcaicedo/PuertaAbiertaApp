"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { subscribeToChanges } from "@/lib/supabase/realtime";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { markNotificationRead } from "@/lib/notifications/actions";
import { notificationIcon, toneClasses } from "@/lib/notifications/icons";
import type { NotificationTone } from "@/lib/profile/data";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "./current-user";

type Incoming = {
  id: string;
  tipo: string;
  tono: NotificationTone;
  titulo: string;
  cuerpo: string;
  href: string;
  leida_en: string | null;
};

const VISIBLE_MS = 5000;

/**
 * Aviso flotante, como el de una app del celular: cuando llega una notificación nueva
 * (mensaje, respuesta de la administración, aviso…) aparece arriba en cualquier pantalla.
 * Tocarlo lleva a lo que avisa; se cierra solo, con la X o deslizándolo hacia arriba.
 */
export function LiveNotifications() {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = React.useState<Incoming | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = React.useRef<number | null>(null);
  const pathRef = React.useRef(pathname);
  pathRef.current = pathname;

  const hide = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    setCurrent(null);
    setDragY(0);
  }, []);

  const show = React.useCallback(
    (n: Incoming) => {
      // Ya está viendo eso (por ejemplo, el chat con quien le escribió): no hace falta avisar.
      if (pathRef.current === n.href) {
        void markNotificationRead(n.id);
        return;
      }
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setDragY(0);
      setCurrent(n);
      navigator.vibrate?.(30);
      hideTimer.current = setTimeout(() => setCurrent(null), VISIBLE_MS);
      // La campana de Inicio y los contadores se actualizan.
      router.refresh();
    },
    [router],
  );

  const userId = user.id;
  React.useEffect(() => {
    if (!isSupabaseConfigured || userId === "demo") return;
    return subscribeToChanges(`avisos-flotantes-${userId}`, (channel) =>
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notificaciones", filter: `perfil_id=eq.${userId}` },
          (payload) => show(payload.new as Incoming),
        )
        // Mensajes seguidos de la misma persona actualizan la misma notificación.
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notificaciones", filter: `perfil_id=eq.${userId}` },
          (payload) => {
            const n = payload.new as Incoming;
            if (!n.leida_en) show(n);
          },
        ),
    );
  }, [userId, show]);

  React.useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  if (!current) return null;
  const Icon = notificationIcon({ kind: current.tipo, tone: current.tono, title: current.titulo });

  function open() {
    if (!current) return;
    void markNotificationRead(current.id);
    const href = current.href;
    hide();
    router.push(href);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-50 mx-auto w-full max-w-[430px] px-3"
    >
      <div
        className="pointer-events-auto flex w-full touch-none animate-in items-center gap-1 rounded-[18px] bg-surface shadow-toast duration-300 fade-in-0 slide-in-from-top-4"
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, opacity: dragY ? 1 + dragY / 120 : undefined }}
        onPointerDown={(e) => {
          dragStart.current = e.clientY;
          if (hideTimer.current) clearTimeout(hideTimer.current);
        }}
        onPointerMove={(e) => {
          if (dragStart.current === null) return;
          setDragY(Math.min(0, e.clientY - dragStart.current));
        }}
        onPointerUp={() => {
          dragStart.current = null;
          // Deslizado hacia arriba: se descarta. Si no, vuelve a su sitio y sigue la cuenta atrás.
          if (dragY < -40) return hide();
          setDragY(0);
          hideTimer.current = setTimeout(() => setCurrent(null), VISIBLE_MS);
        }}
      >
        <button
          type="button"
          onClick={() => dragY === 0 && open()}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[18px] py-3 pl-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span aria-hidden className={cn("inline-flex shrink-0 rounded-field p-2", toneClasses[current.tono] ?? toneClasses.brand)}>
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-overline font-medium text-text-tertiary">Puerta Abierta · ahora</span>
            <span className="truncate text-caption font-semibold text-text">{current.titulo}</span>
            {current.cuerpo && <span className="line-clamp-2 text-label text-text-secondary">{current.cuerpo}</span>}
          </span>
        </button>
        <button
          type="button"
          onClick={hide}
          aria-label="Cerrar aviso"
          className="mr-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-text-tertiary hover:bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
