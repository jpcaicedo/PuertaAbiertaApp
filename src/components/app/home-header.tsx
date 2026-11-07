import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";

type HomeHeaderProps = {
  firstName: string;
  unitLabel: string;
  avatar: string;
  /** Muestra un punto rojo sobre la campana. */
  hasUnread?: boolean;
};

/**
 * Encabezado de Inicio (Figma "Encabezado", 476:955): alto 64, padding 20.
 * Avatar 36 + nombre 15/22 SemiBold azul + unidad 12/16 Medium. Campana 22 y logo 42×28, gap 14.
 */
export function HomeHeader({ firstName, unitLabel, avatar, hasUnread = false }: HomeHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-5">
      <Link href="/perfil" className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <Image src={avatar} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
        <span className="flex flex-col">
          <span className="text-body font-semibold text-brand">{firstName}</span>
          <span className="text-overline font-medium text-text-secondary">{unitLabel}</span>
        </span>
      </Link>

      <div className="flex items-center gap-3.5">
        <Link
          href="/notificaciones"
          aria-label={hasUnread ? "Notificaciones, tienes nuevas" : "Notificaciones"}
          className="relative -m-2 grid size-[38px] place-items-center rounded-full text-ink transition-colors hover:bg-brand-soft/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Bell className="size-[22px]" strokeWidth={2} aria-hidden />
          {hasUnread && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-error ring-2 ring-bg" />}
        </Link>
        <Image src="/images/logo-skema.svg" alt="Skema" width={42} height={28} unoptimized className="h-7 w-[42px] object-contain" />
      </div>
    </header>
  );
}
