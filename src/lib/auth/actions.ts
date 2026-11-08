"use server";

import { redirect } from "next/navigation";
import { demoUser, formatUnit, lookupResidenceCode } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";

/* ───────────────────────── R2 · Código de residencia ───────────────────────── */

/** Devuelve "Residencial Samán, Torre E, Apto 204" si el código existe y no se ha usado. */
export async function lookupUnit(code: string): Promise<string | null> {
  const clean = code.trim().toUpperCase();
  if (!isSupabaseConfigured) {
    const unit = lookupResidenceCode(clean);
    return unit ? formatUnit(unit) : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validar_codigo", { p_codigo: clean });
  const row = !error && Array.isArray(data) ? (data[0] as { conjunto: string; torre: string; apartamento: string }) : null;
  return row ? formatUnit({ project: row.conjunto, tower: row.torre, apartment: row.apartamento }) : null;
}

export async function checkResidenceCode(code: string) {
  const unitLabel = await lookupUnit(code);
  return unitLabel ? { ok: true as const, unitLabel } : { ok: false as const };
}

/* ───────────────────────── R4 + R5 · Crear la cuenta ───────────────────────── */

export type RegisterInput = { code: string; name: string; email: string; password: string };
export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Se llama al aceptar las normas (R5). El perfil y el uso del código los hace la base de datos
 * (trigger `handle_new_user`) en la misma transacción: si algo falla, no se crea nada.
 */
export async function registerResident(input: RegisterInput): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: true };

  if (!(await lookupUnit(input.code))) {
    return { ok: false, error: "Este código ya se usó para crear una cuenta. Pide uno nuevo a la administración." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        codigo: input.code.trim().toUpperCase(),
        nombre: input.name.trim(),
        acepto_normas: true,
        acepto_datos: true,
      },
    },
  });

  if (!error) return { ok: true };
  if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
    return { ok: false, error: "Ya hay una cuenta con este correo. Inicia sesión o recupera tu contraseña." };
  }
  if (error.code === "weak_password") {
    return { ok: false, error: "La contraseña es muy débil. Usa mínimo 8 caracteres, con al menos un número." };
  }
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return { ok: false, error: "Hubo muchos intentos seguidos. Espera un minuto y vuelve a intentarlo." };
  }
  return { ok: false, error: "No pudimos crear tu cuenta. Revisa tu conexión e inténtalo de nuevo." };
}

/* ───────────────────────── R6 · Perfil inicial ───────────────────────── */

export type ProfileSetup = { bio: string; showApartment: boolean; showPhone: boolean; inDirectory: boolean };

export async function saveProfileSetup(input: ProfileSetup): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: true };
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Tu sesión se cerró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("perfiles")
    .update({
      bio: input.bio.trim() || null,
      mostrar_apartamento: input.showApartment,
      mostrar_telefono: input.showPhone,
      en_directorio: input.inDirectory,
    })
    .eq("id", user.id);
  return error ? { ok: false, error: "No pudimos guardar tu perfil. Inténtalo de nuevo." } : { ok: true };
}

/* ───────────────────────── R7 · Iniciar y cerrar sesión ───────────────────────── */

export async function signIn(email: string, password: string): Promise<{ ok: boolean; admin?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isSupabaseConfigured) return { ok: cleanEmail === demoUser.email && password === demoUser.password };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
  if (error || !data.user) return { ok: false };
  // La administración entra directo a su panel.
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", data.user.id).maybeSingle();
  return { ok: true, admin: perfil?.rol === "administracion" };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
