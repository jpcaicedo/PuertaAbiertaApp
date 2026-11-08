import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  getProduct as demoProduct,
  getService as demoService,
  products as demoProducts,
  services as demoServices,
  type NeighborService,
  type Product,
  type ProductCategory,
  type ProductCondition,
  type Review,
  type ServiceCategory,
} from "./data";
import type { MyListing } from "./store";

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

/* ───────────────────────────── Marketplace ───────────────────────────── */

type ProductRow = {
  id: string;
  slug: string;
  perfil_id: string | null;
  titulo: string;
  descripcion: string;
  precio: number;
  precio_anterior: number | null;
  categoria: ProductCategory;
  condicion: ProductCondition;
  condicion_texto: string | null;
  entrega: string;
  fotos: string[];
  estado: "activo" | "vendido" | "retirado";
  vendido_en: string | null;
  created_at: string;
  extra: { name?: string; tower?: string; avatar?: string };
  nombre: string | null;
  avatar_url: string | null;
  torre: string | null;
  recibe_mensajes: boolean;
};

const PRODUCT_COLUMNS =
  "id, slug, perfil_id, titulo, descripcion, precio, precio_anterior, categoria, condicion, condicion_texto, entrega, fotos, estado, vendido_en, created_at, extra, nombre, avatar_url, torre, recibe_mensajes";

const conditionText: Record<ProductCondition, string> = {
  nuevo: "Nuevo",
  "como-nuevo": "Usado · como nuevo",
  usado: "Usado · buen estado",
};

function toProduct(r: ProductRow): Product {
  const name = r.nombre ?? r.extra?.name ?? "Vecino";
  return {
    id: r.slug,
    dbId: r.id,
    title: r.titulo,
    price: r.precio,
    previousPrice: r.precio_anterior ?? undefined,
    image: r.fotos[0],
    images: r.fotos,
    category: r.categoria,
    conditionLabel: r.condicion_texto ?? conditionText[r.condicion],
    description: r.descripcion,
    delivery: r.entrega,
    seller: {
      id: r.perfil_id ?? r.slug,
      name,
      firstName: name.split(/\s+/)[0],
      apartment: "",
      tower: r.torre ?? r.extra?.tower ?? "",
      avatar: r.avatar_url ?? r.extra?.avatar,
      verified: true,
    },
    ownerId: r.perfil_id,
    acceptsMessages: r.perfil_id ? r.recibe_mensajes : false,
  };
}

/** D8 · Productos a la venta en el conjunto, los más nuevos primero. */
export const getProducts = cache(async (): Promise<Product[]> => {
  if (!isSupabaseConfigured) return demoProducts;
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_productos")
    .select(PRODUCT_COLUMNS)
    .eq("estado", "activo")
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();
  return (data ?? []).map(toProduct);
});

/** D9 · Un producto. Al dueño se le muestra aunque ya esté vendido. */
export const getProductBySlug = cache(async (slug: string): Promise<(Product & { status: string }) | null> => {
  if (!isSupabaseConfigured) {
    const p = demoProduct(slug);
    return p ? { ...p, status: "activo" } : null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("marketplace_productos").select(PRODUCT_COLUMNS).eq("slug", slug).maybeSingle<ProductRow>();
  return data ? { ...toProduct(data), status: data.estado } : null;
});

/** D12 · Mis publicaciones, con cuántos vecinos escribieron por cada una. `null` en modo demo. */
export async function getMyListings(): Promise<MyListing[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return [];
  const [{ data }, { data: interested }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, slug, titulo, precio, categoria, condicion, fotos, estado, vendido_en, created_at")
      .eq("perfil_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Pick<ProductRow, "id" | "slug" | "titulo" | "precio" | "categoria" | "condicion" | "fotos" | "estado" | "vendido_en" | "created_at">[]>(),
    supabase.rpc("interesados_por_producto"),
  ]);
  const counts = new Map(((interested ?? []) as { producto_id: string; vecinos: number }[]).map((x) => [x.producto_id, x.vecinos]));
  return (data ?? []).map((r) => ({
    id: r.slug,
    dbId: r.id,
    title: r.titulo,
    price: r.precio,
    category: r.categoria,
    condition: r.condicion,
    publishedAt: r.created_at,
    soldAt: r.vendido_en ?? undefined,
    messages: counts.get(r.id) ?? 0,
    image: r.fotos[0],
    removed: r.estado === "retirado",
  }));
}
