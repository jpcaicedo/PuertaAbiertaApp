import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { demoCurrentUser, type CurrentUser, type Role } from "./types";

export type { CurrentUser, Role } from "./types";

type ProfileRow = {
  id: string;
  nombre: string;
  rol: Role;
  avatar_url: string | null;
  bio: string | null;
  apartamentos: { numero: string; torres: { nombre: string } | null } | null;
};

/**
 * Vecino que hizo la petición, leído de Supabase (una sola vez por petición).
 * `null` si no hay sesión o la cuenta no tiene perfil.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return demoCurrentUser;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, avatar_url, bio, apartamentos ( numero, torres ( nombre ) )")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  if (!data) return null;

  const tower = data.apartamentos?.torres?.nombre ?? "";
  const apartment = data.apartamentos?.numero ?? "";
  return {
    id: data.id,
    fullName: data.nombre,
    firstName: data.nombre.split(/\s+/)[0],
    tower,
    apartment,
    unitLabel: data.rol === "administracion" ? "Administración" : `Torre ${tower} · Apto ${apartment}`,
    avatar: data.avatar_url,
    bio: data.bio,
    role: data.rol,
  };
});
