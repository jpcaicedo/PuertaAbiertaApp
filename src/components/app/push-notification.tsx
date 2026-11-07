"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

/**
 * Notificación push simulada (A7, Z5): 366 de ancho, radio 18, sombra 0 8 24 / 15 %.
 * Aparece a los `delay` ms y lleva a `href`.
 * TODO: reemplazar por la notificación push real cuando la administración responda.
 */
export function PushNotification({
  href,
  children,
  delay = 4000,
}: {
  href: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(44px,env(safe-area-inset-top))] z-40 mx-auto w-full max-w-[430px] px-3"
    >
      {visible && (
        <Link
          href={href}
          className="pointer-events-auto flex w-full animate-in items-center gap-3 rounded-[18px] bg-surface px-3.5 py-3 shadow-toast duration-300 fade-in-0 slide-in-from-top-4 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span aria-hidden className="inline-flex shrink-0 rounded-field bg-success-soft p-2 text-success">
            <Bell className="size-5" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-overline font-medium text-text-tertiary">Puerta Abierta · ahora</span>
            <span className="text-caption font-semibold text-text">{children}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
