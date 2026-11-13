"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setZonesOrigin, useZonesOrigin } from "@/lib/zones/origin";
import { Calendar, House, Map, User, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; /** Rutas que también activan la pestaña. */ match: string[] };

const tabs: Tab[] = [
  { href: "/inicio", label: "Inicio", icon: House, match: ["/inicio", "/avisos", "/admin", "/marketplace"] },
  { href: "/mapa", label: "Mapa", icon: Map, match: ["/mapa"] },
  { href: "/agenda", label: "Agenda", icon: Calendar, match: ["/agenda"] },
  { href: "/directorio", label: "Directorio", icon: Users, match: ["/directorio"] },
  { href: "/perfil", label: "Perfil", icon: User, match: ["/perfil"] },
];

/**
 * Barra inferior flotante (Figma "Barra inferior", 476:967).
 * 358×64, radio 32, 16px de los lados y 22px del borde inferior, sombra 0 6 10 / 12 %.
 * En iPhone se despega de la zona segura (indicador de inicio / barra de Safari) con
 * `--tabbar-offset`; el contenedor ocupa el ancho completo pero no captura toques.
 * Pestañas de 66×52: icono 20 + etiqueta 12/16 (activa: azul SemiBold · inactiva: #5A6478 Medium).
 */
export function TabBar() {
  const pathname = usePathname();
  const zonesOrigin = useZonesOrigin();

  // Zonas comunes cuelga de la pestaña desde la que se entró (Inicio o Agenda).
  React.useEffect(() => {
    if (pathname === "/agenda") setZonesOrigin("agenda");
    else if (pathname === "/inicio" || pathname === "/avisos") setZonesOrigin("inicio");
  }, [pathname]);
  const inZones = pathname === "/zonas-comunes" || pathname.startsWith("/zonas-comunes/");

  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[var(--tabbar-offset)]"
    >
      <ul className="pointer-events-auto mx-auto flex h-16 max-w-[398px] items-center justify-between rounded-[32px] bg-surface px-2.5 shadow-nav dark:ring-1 dark:ring-white/10">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active =
            match.some((m) => pathname === m || pathname.startsWith(`${m}/`)) ||
            (inZones && href === (zonesOrigin === "agenda" ? "/agenda" : "/inicio"));
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
