import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/** Rutas que se ven sin iniciar sesión. */
const PUBLIC = ["/", "/ingresar", "/politica-de-datos"];
const PUBLIC_PREFIXES = ["/registro", "/recuperar"];

const isPublic = (path: string) => PUBLIC.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

/**
 * Refresca la sesión de Supabase en cada petición y protege las rutas:
 * - sin sesión → /ingresar?siguiente=…
 * - con sesión en la bienvenida o en /ingresar → /inicio
 * - /admin solo para la administración
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Importante: no poner código entre createServerClient y getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    const [pathname, search = ""] = to.split("?");
    url.pathname = pathname;
    url.search = search ? `?${search}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) {
    if (isPublic(path)) return response;
    return redirectTo(`/ingresar?siguiente=${encodeURIComponent(path + request.nextUrl.search)}`);
  }

  if (path === "/" || path === "/ingresar") return redirectTo("/inicio");

  if (path.startsWith("/admin")) {
    const { data } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
    if (data?.rol !== "administracion") return redirectTo("/inicio");
  }

  return response;
}
