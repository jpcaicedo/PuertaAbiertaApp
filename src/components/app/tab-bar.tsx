"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, House, Map, User, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; /** Rutas que también activan la pestaña. */ match: string[] };

const tabs: Tab[] = [
  { href: "/inicio", label: "Inicio", icon: House, match: ["/inicio", "/avisos"] },
  { href: "/mapa", label: "Mapa", icon: Map, match: ["/mapa"] },
  { href: "/agenda", label: "Agenda", icon: Calendar, match: ["/agenda"] },
  { href: "/directorio", label: "Directorio", icon: Users, match: ["/directorio"] },
  { href: "/perfil", label: "Perfil", icon: User, match: ["/perfil"] },
];

/**
 * Barra inferior flotante (Figma "Barra inferior", 476:967).
 * 358×64, radio 32, 16px de los lados y 22px del borde inferior, sombra 0 6 10 / 12 %.
 * Pestañas de 66×52: icono 20 + etiqueta 12/16 (activa: azul SemiBold · inactiva: #5A6478 Medium).
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-[max(22px,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-32px)] max-w-[398px]"
    >
      <ul className="flex h-16 items-center justify-between rounded-[32px] bg-surface px-2.5 shadow-nav">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[52px] w-[66px] flex-col items-center justify-center gap-[3px] rounded-[20px] px-2 py-1.5 text-overline",
                  "transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  active
                    ? "font-semibold text-brand"
                    : "font-medium text-text-tertiary hover:bg-brand-soft/50 hover:text-text",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
