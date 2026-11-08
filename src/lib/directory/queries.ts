import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getService as demoService, services as demoServices, type NeighborService, type Review, type ServiceCategory } from "./data";

/** Servicios del directorio (D1–D4) leídos de la vista `directorio_servicios`. En modo demo, los de ejemplo. */

type Row = {
  id: string;
  slug: string;
  perfil_id: string | null;
  categoria: ServiceCategory;
  titulo: string;
  rol_corto: string | null;
  descripcion: string;
  descripcion_larga: string | null;
  precio: string;
  disponibilidad: string;
  acepta_llamadas: boolean;
  horario_llamadas: string | null;
  extra: {
    name?: string;
    tower?: string;
    apartment?: string;
    avatar?: string;
    feminine?: boolean;
    phone?: string;
    rating?: number;
    reviewCount?: number;
    reviews?: Review[];
    keywords?: string[];
  };
  nombre: string | null;
  avatar_url: string | null;
  torre: string | null;
  apartamento: string | null;
  telefono: string | null;
  recibe_mensajes: boolean;
};

const COLUMNS =
  "id, slug, perfil_id, categoria, titulo, rol_corto, descripcion, descripcion_larga, precio, disponibilidad, acepta_llamadas, horario_llamadas, extra, nombre, avatar_url, torre, apartamento, telefono, recibe_mensajes";

function toService(r: Row): NeighborService {
  const x = r.extra ?? {};
  const name = r.nombre ?? x.name ?? "Vecino";
  const avatar = r.avatar_url ?? x.avatar;
  return {
    id: r.slug,
    neighbor: {
      id: r.perfil_id ?? r.slug,
      name,
      firstName: name.split(/\s+/)[0],
      apartment: r.perfil_id ? (r.apartamento ?? "") : (x.apartment ?? ""),
      tower: r.torre ?? x.tower ?? "",
      avatar,
      avatarLarge: avatar,
      verified: true,
      feminine: x.feminine,
    },
    title: r.titulo,
    shortRole: r.rol_corto ?? r.titulo,
    category: r.categoria,
    rating: x.rating,
    reviewCount: x.reviewCount ?? 0,
    description: r.descripcion,
    longDescription: r.descripcion_larga ?? r.descripcion,
    price: r.precio,
    schedule: r.disponibilidad,
    callHours: r.acepta_llamadas ? (r.horario_llamadas ?? "cualquier hora razonable") : null,
    phone: r.telefono ?? x.phone,
    reviews: x.reviews ?? [],
    keywords: x.keywords ?? [],
    ownerId: r.perfil_id,
    acceptsMessages: r.perfil_id ? r.recibe_mensajes : false,
  };
}

export const getServices = cache(async (): Promise<NeighborService[]> => {
  if (!isSupabaseConfigured) return demoServices;
  const supabase = await createClient();
  const { data } = await supabase
    .from("directorio_servicios")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  return (data ?? []).map(toService);
});

export const getServiceBySlug = cache(async (slug: string): Promise<NeighborService | null> => {
  if (!isSupabaseConfigured) return demoService(slug);
  const supabase = await createClient();
  const { data } = await supabase.from("directorio_servicios").select(COLUMNS).eq("slug", slug).maybeSingle<Row>();
  return data ? toService(data) : null;
});
