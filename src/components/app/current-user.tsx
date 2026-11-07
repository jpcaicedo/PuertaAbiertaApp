"use client";

import * as React from "react";
import Image from "next/image";
import { demoCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const CurrentUserContext = React.createContext<CurrentUser | null>(null);

/** Comparte con toda la app el vecino que inició sesión (lo carga el layout raíz en el servidor). */
export function CurrentUserProvider({ user, children }: { user: CurrentUser | null; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

/**
 * Vecino actual. En las pantallas protegidas siempre hay sesión (lo garantiza el middleware);
 * si no la hay (modo demo o páginas públicas) devuelve a Sandra, la vecina de ejemplo.
 */
export function useCurrentUser(): CurrentUser {
  return React.useContext(CurrentUserContext) ?? demoCurrentUser;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** Foto del vecino o, si no tiene, sus iniciales en un círculo azul suave. */
export function UserAvatar({ user, size, className }: { user: CurrentUser; size: number; className?: string }) {
  if (user.avatar) {
    return (
      <Image
        src={user.avatar}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials(user.fullName)}
    </span>
  );
}
