import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/lib/mock-data";
import type { NotificationTone } from "@/lib/profile/data";
import type { RemoteNotification } from "./types";

type Row = {
  id: string;
  tipo: string;
  tono: string;
  titulo: string;
  cuerpo: string;
  href: string;
  created_at: string;
  leida_en: string | null;
};

const tones: NotificationTone[] = ["success", "brand", "warm", "neutral"];

/** "Ayer" si fue el día anterior; si no, "Hace 5 min", "Hace 2 h", "Hace 3 d". */
function when(iso: string, now: Date) {
  const label = formatTimeAgo(new Date(iso), now);
  return label === "Hace 1 d" ? "Ayer" : label;
}

/** N1 · Las últimas 50 notificaciones del usuario. `null` en modo demo. */
export async function getNotifications(): Promise<RemoteNotification[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notificaciones")
    .select("id, tipo, tono, titulo, cuerpo, href, created_at, leida_en")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<Row[]>();
  const now = new Date();
  return (data ?? []).map((n) => ({
    id: n.id,
    kind: n.tipo,
    tone: (tones as string[]).includes(n.tono) ? (n.tono as NotificationTone) : "brand",
    title: n.titulo,
    body: n.cuerpo,
    when: when(n.created_at, now),
    unread: !n.leida_en,
    href: n.href,
  }));
}
