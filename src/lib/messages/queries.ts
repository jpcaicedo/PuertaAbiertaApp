import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/directory/data";

/**
 * Mensajes entre vecinos guardados en Supabase.
 * Una conversación se identifica por el otro vecino:
 *   · con cuenta: su id (uuid)
 *   · de ejemplo (sin cuenta): "demo-s-<slug del servicio>" o "demo-p-<slug del producto>".
 *     Lo que uno le escribe se guarda, pero nunca responde.
 */

type Row = {
  id: string;
  de: string;
  para: string | null;
  para_demo: string | null;
  texto: string;
  created_at: string;
  leido_en: string | null;
  oculto_para_receptor: boolean;
  oculto_para_emisor: boolean;
  tipo: "texto" | "foto" | "audio";
  adjunto: string | null;
  duracion: number | null;
};
type PersonRow = {
  id: string;
  nombre: string;
  avatar_url: string | null;
  recibe_mensajes: boolean;
  apartamentos: { torres: { nombre: string } | null } | null;
};

export type Peer = {
  /** uuid o "demo-s-camila" */
  id: string;
  name: string;
  firstName: string;
  tower: string;
  avatar?: string;
  acceptsMessages: boolean;
  /** Vecino de ejemplo: no tiene cuenta y no responde. */
  demo?: boolean;
};

export type Conversation = { peer: Peer; last: string; lastAt: string; unread: number; mine: boolean };

const COLUMNS =
  "id, de, para, para_demo, texto, created_at, leido_en, oculto_para_receptor, oculto_para_emisor, tipo, adjunto, duracion";

/** "0:12" */
export const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** Lo que se ve en la bandeja: el texto, o "Foto" / "Mensaje de voz (0:12)". */
export function previewText(m: { tipo: string; texto: string; duracion: number | null }) {
  if (m.tipo === "foto") return m.texto.trim() ? `Foto · ${m.texto}` : "Foto";
  if (m.tipo === "audio") return `Mensaje de voz${m.duracion != null ? ` (${formatDuration(m.duracion)})` : ""}`;
  return m.texto;
}
const UUID = /^[0-9a-f-]{36}$/i;
const DEMO = /^demo-([sp])-([a-z0-9-]+)$/;

/** "demo-s-camila" ⇄ "s:camila" (como se guarda en la base de datos). */
export const demoKeyToTarget = (key: string) => {
  const m = DEMO.exec(key);
  return m ? `${m[1]}:${m[2]}` : null;
};
const targetToDemoKey = (target: string) => `demo-${target.replace(":", "-")}`;

/** "5:12 p. m." en hora de Colombia. */
export function chatTime(iso: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso))
    .replace(/\s/g, " ");
}

const toPeer = (p: PersonRow): Peer => ({
  id: p.id,
  name: p.nombre,
  firstName: p.nombre.split(/\s+/)[0],
  tower: p.apartamentos?.torres?.nombre ?? "",
  avatar: p.avatar_url ?? undefined,
  acceptsMessages: p.recibe_mensajes,
});

async function session() {
  const supabase = await createClient();
  const user = await getSessionUser();
  return { supabase, me: user?.id ?? null };
}

async function people(ids: string[]) {
  if (!ids.length) return [];
  const { supabase } = await session();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, avatar_url, recibe_mensajes, apartamentos ( torres ( nombre ) )")
    .in("id", ids)
    .returns<PersonRow[]>();
  return (data ?? []).map(toPeer);
}

type DemoExtra = { name?: string; tower?: string; avatar?: string };

/** Nombre, torre y foto de los vecinos de ejemplo (servicios y productos sin cuenta). */
async function demoPeers(targets: string[]): Promise<Peer[]> {
  if (!targets.length) return [];
  const { supabase } = await session();
  const services = targets.filter((t) => t.startsWith("s:")).map((t) => t.slice(2));
  const products = targets.filter((t) => t.startsWith("p:")).map((t) => t.slice(2));
  const [{ data: s }, { data: p }] = await Promise.all([
    services.length
      ? supabase.from("servicios").select("slug, extra").in("slug", services).is("perfil_id", null)
      : Promise.resolve({ data: [] as { slug: string; extra: DemoExtra }[] }),
    products.length
      ? supabase.from("productos").select("slug, extra").in("slug", products).is("perfil_id", null)
      : Promise.resolve({ data: [] as { slug: string; extra: DemoExtra }[] }),
  ]);
  const build = (kind: "s" | "p", rows: { slug: string; extra: DemoExtra }[] | null) =>
    (rows ?? []).map((r): Peer => {
      const name = r.extra?.name ?? "Vecino";
      return {
        id: `demo-${kind}-${r.slug}`,
        name,
        firstName: name.split(/\s+/)[0],
        tower: r.extra?.tower ?? "",
        avatar: r.extra?.avatar,
        acceptsMessages: true,
        demo: true,
      };
    });
  return [...build("s", s), ...build("p", p)];
}

const toMessage = (m: Row, me: string, urls: Map<string, string>): ChatMessage => ({
  id: m.id,
  mine: m.de === me,
  text: m.texto,
  time: chatTime(m.created_at),
  kind: m.tipo === "foto" ? "photo" : m.tipo === "audio" ? "audio" : "text",
  media: m.adjunto ? urls.get(m.adjunto) : undefined,
  path: m.adjunto ?? undefined,
  duration: m.duracion ?? undefined,
});

/** Enlaces temporales (1 h) para las fotos y audios de la conversación. */
async function signMedia(rows: Row[]): Promise<Map<string, string>> {
  const paths = rows.map((r) => r.adjunto).filter((p): p is string => !!p);
  if (!paths.length) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.storage.from("chat").createSignedUrls(paths, 3600);
  const urls = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
  return urls;
}

/** D4 · Conversación con un vecino (real o de ejemplo). Marca como leídos los mensajes que llegaron. */
export async function getConversation(peerKey: string): Promise<{ me: string; peer: Peer; messages: ChatMessage[] } | null> {
  if (!isSupabaseConfigured) return null;
  const { supabase, me } = await session();
  if (!me || me === peerKey) return null;

  const target = demoKeyToTarget(peerKey);
  if (target) {
    const [peer] = await demoPeers([target]);
    if (!peer) return null;
    const { data } = await supabase
      .from("mensajes")
      .select(COLUMNS)
      .eq("de", me)
      .eq("para_demo", target)
      .eq("oculto_para_emisor", false)
      .order("created_at")
      .limit(300)
      .returns<Row[]>();
    const urls = await signMedia(data ?? []);
    return { me, peer, messages: (data ?? []).map((m) => toMessage(m, me, urls)) };
  }

  if (!UUID.test(peerKey)) return null;
  const [peer] = await people([peerKey]);
  if (!peer) return null;

  const { data } = await supabase
    .from("mensajes")
    .select(COLUMNS)
    .or(
      `and(de.eq.${me},para.eq.${peerKey},oculto_para_emisor.eq.false),and(de.eq.${peerKey},para.eq.${me},oculto_para_receptor.eq.false)`,
    )
    .order("created_at")
    .limit(300)
    .returns<Row[]>();

  if (data?.some((m) => m.para === me && !m.leido_en)) {
    await supabase.from("mensajes").update({ leido_en: new Date().toISOString() }).eq("de", peerKey).eq("para", me).is("leido_en", null);
  }

  const urls = await signMedia(data ?? []);
  return { me, peer, messages: (data ?? []).map((m) => toMessage(m, me, urls)) };
}

/** Bandeja de mensajes: la última línea de cada conversación, la más reciente primero. */
export async function getInbox(): Promise<Conversation[] | null> {
  if (!isSupabaseConfigured) return null;
  const { supabase, me } = await session();
  if (!me) return [];
  const { data } = await supabase
    .from("mensajes")
    .select(COLUMNS)
    .or(`and(de.eq.${me},oculto_para_emisor.eq.false),and(para.eq.${me},oculto_para_receptor.eq.false)`)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Row[]>();

  const byPeer = new Map<string, { last: Row; unread: number }>();
  for (const m of data ?? []) {
    const key = m.para_demo ? targetToDemoKey(m.para_demo) : m.de === me ? m.para! : m.de;
    const entry = byPeer.get(key) ?? { last: m, unread: 0 };
    if (m.para === me && !m.leido_en) entry.unread += 1;
    byPeer.set(key, entry);
  }

  const keys = [...byPeer.keys()];
  const [real, demo] = await Promise.all([
    people(keys.filter((k) => UUID.test(k))),
    demoPeers(keys.map(demoKeyToTarget).filter((t): t is string => !!t)),
  ]);

  return [...real, ...demo]
    .map((peer) => {
      const { last, unread } = byPeer.get(peer.id)!;
      return { peer, last: previewText(last), lastAt: last.created_at, unread, mine: last.de === me };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

/** Mensajes sin leer (para Perfil). */
export async function getUnreadCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { supabase, me } = await session();
  if (!me) return 0;
  const { count } = await supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("para", me)
    .eq("oculto_para_receptor", false)
    .is("leido_en", null);
  return count ?? 0;
}
