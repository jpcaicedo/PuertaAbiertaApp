"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { ServiceDraft } from "./store";

/** D6 · Publicar servicio. */
export async function publishService(
  draft: ServiceDraft,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("publicar_servicio", {
      p_categoria: draft.category,
      p_titulo: draft.title,
      p_descripcion: draft.description,
      p_precio: draft.price,
      p_disponibilidad: draft.availability,
      p_mostrar_apartamento: draft.showApartment,
      p_acepta_llamadas: draft.acceptCalls,
      p_telefono: draft.acceptCalls ? (draft.phone ?? "") : null,
    })
    .single<{ id: string; slug: string }>();
  revalidatePath("/", "layout");
  if (error || !data) {
    if (error?.message.includes("TELEFONO_INVALIDO")) return { ok: false, error: "Revisa el número de celular." };
    return { ok: false, error: "No pudimos publicar el servicio. Revisa los datos e inténtalo de nuevo." };
  }
  return { ok: true, slug: data.slug };
}

/** Quitar un servicio propio del Directorio. Deja de verse para todos y se pueden seguir leyendo los mensajes. */
export async function deleteService(slug: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return { ok: false };
  const { data, error } = await supabase
    .from("servicios")
    .update({ activo: false })
    .eq("slug", slug)
    .eq("perfil_id", user.id)
    .select("id");
  revalidatePath("/", "layout");
  return { ok: !error && (data?.length ?? 0) > 0 };
}

export type ProductInput = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  delivery: string;
  photos: string[];
};

/** D10 · Publicar producto. Las fotos ya están subidas en Storage. */
export async function publishProduct(input: ProductInput): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("publicar_producto", {
      p_titulo: input.title,
      p_descripcion: input.description,
      p_precio: input.price,
      p_categoria: input.category,
      p_condicion: input.condition,
      p_entrega: input.delivery,
      p_fotos: input.photos,
    })
    .single<{ id: string; slug: string }>();
  revalidatePath("/", "layout");
  if (error || !data) return { ok: false, error: "No pudimos publicar el producto. Inténtalo de nuevo." };
  return { ok: true, slug: data.slug };
}

/** D13 · Marcar como vendido. */
export async function markProductSold(dbId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_vendido", { p_id: dbId });
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** Eliminar una publicación propia del Marketplace. */
export async function deleteProduct(dbId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("eliminar_producto", { p_id: dbId });
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** D14 · Reportar publicación. La administración no le muestra a nadie quién reportó. */
export async function reportProduct(dbId: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reportar_producto", { p_producto: dbId, p_motivo: reason });
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** Dejar o editar mi reseña de un servicio. La base de datos revisa que ya le hayas escrito. */
export async function reviewService(
  dbId: string,
  slug: string,
  stars: number,
  text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("resenar_servicio", { p_servicio: dbId, p_estrellas: stars, p_comentario: text });
  revalidatePath("/directorio", "layout");
  if (error) {
    if (error.message.includes("SIN_CONTACTO"))
      return { ok: false, error: "Escríbele primero por la app. Después de contratarlo puedes dejarle una reseña." };
    if (error.message.includes("SERVICIO_PROPIO")) return { ok: false, error: "No puedes reseñar tu propio servicio." };
    return { ok: false, error: "No pudimos guardar la reseña. Inténtalo de nuevo." };
  }
  revalidatePath(`/directorio/${slug}`);
  return { ok: true };
}

/** Borrar mi reseña. */
export async function deleteReview(dbId: string, slug: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("borrar_resena", { p_servicio: dbId });
  revalidatePath("/directorio", "layout");
  revalidatePath(`/directorio/${slug}`);
  return { ok: !error };
}
