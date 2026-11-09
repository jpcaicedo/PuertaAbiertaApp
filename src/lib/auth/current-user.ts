import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { demoCurrentUser, type CurrentUser, type Role } from "./types";

export type { CurrentUser, Role } from "./types";

type ProfileRow = {
  id: string;
  nombre: string;
  rol: Role;
  avatar_url: string | null;
  bio: string | null;
  mostrar_apartamento: boolean;
  mostrar_telefono: boolean;
  en_directorio: boolean;
  recibe_mensajes: boolean;
  notificaciones: Partial<
    Record<"all" | "requests" | "agenda" | "messages" | "marketplace", boolean>
  > | null;
  apartamentos: { numero: string; torres: { nombre: string } | null } | null;
};

/**
 * Vecino que hizo la petición, leído de Supabase (una sola vez por petición).
 * `null` si no hay sesión o la cuenta no tiene perfil.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return demoCurrentUser;

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const [{ data }, { count: unread }, { count: unreadMessages }] = await Promise.all([
    supabase
      .from("perfiles")
      .select(
        "id, nombre, rol, avatar_url, bio, mostrar_apartamento, mostrar_telefono, en_directorio, recibe_mensajes, notificaciones, apartamentos ( numero, torres ( nombre ) )",
      )
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .is("leida_en", null),
    supabase
      .from("mensajes")
      .select("id", { count: "exact", head: true })
      .eq("para", user.id)
      .eq("oculto_para_receptor", false)
      .is("leido_en", null),
  ]);
  if (!data) return null;

  const tower = data.apartamentos?.torres?.nombre ?? "";
  const apartment = data.apartamentos?.numero ?? "";
  return {
    id: data.id,
    fullName: data.nombre,
    firstName: data.nombre.split(/\s+/)[0],
    tower,
    apartment,
    unitLabel:
      data.rol === "administracion"
        ? "Administración"
        : `Torre ${tower} · Apto ${apartment}`,
    avatar: data.avatar_url,
    bio: data.bio,
    role: data.rol,
    unreadNotifications: unread ?? 0,
    unreadMessages: unreadMessages ?? 0,
    prefs: {
      privacy: {
        showApartment: data.mostrar_apartamento,
        showPhone: data.mostrar_telefono,
        inDirectory: data.en_directorio,
        acceptMessages: data.recibe_mensajes,
      },
      notify: {
        requests: data.notificaciones?.requests ?? true,
        agenda: data.notificaciones?.agenda ?? true,
        messages: data.notificaciones?.messages ?? true,
        marketplace: data.notificaciones?.marketplace ?? true,
        all: data.notificaciones?.all ?? true,
      },
    },
  };
});
