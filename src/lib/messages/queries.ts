import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/directory/data";

/** Mensajes entre vecinos guardados en Supabase. */

type Row = { id: string; de: string; para: string; texto: string; created_at: string; leido_en: string | null };
type PersonRow = {
  id: string;
  nombre: string;
  avatar_url: string | null;
  recibe_mensajes: boolean;
  apartamentos: { torres: { nombre: string } | null } | null;
};

export type Peer = { id: string; name: string; firstName: string; tower: string; avatar?: string; acceptsMessages: boolean };

export type Conversation = { peer: Peer; last: string; lastAt: string; unread: number; mine: boolean };

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

/** D4 · Conversación con un vecino. Marca como leídos los mensajes que llegaron. */
export async function getConversation(peerId: string): Promise<{ me: string; peer: Peer; messages: ChatMessage[] } | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(peerId)) return null;
  const { supabase, me } = await session();
  if (!me || me === peerId) return null;
  const [peer] = await people([peerId]);
  if (!peer) return null;

  const { data } = await supabase
    .from("mensajes")
    .select("id, de, para, texto, created_at, leido_en")
    .or(`and(de.eq.${me},para.eq.${peerId}),and(de.eq.${peerId},para.eq.${me})`)
    .order("created_at")
    .limit(300)
    .returns<Row[]>();

  if (data?.some((m) => m.para === me && !m.leido_en)) {
    await supabase.from("mensajes").update({ leido_en: new Date().toISOString() }).eq("de", peerId).eq("para", me).is("leido_en", null);
  }

  return {
    me,
    peer,
    messages: (data ?? []).map((m) => ({ id: m.id, mine: m.de === me, text: m.texto, time: chatTime(m.created_at) })),
  };
}

/** Bandeja de mensajes: la última línea de cada conversación, la más reciente primero. */
export async function getInbox(): Promise<Conversation[] | null> {
  if (!isSupabaseConfigured) return null;
  const { supabase, me } = await session();
  if (!me) return [];
  const { data } = await supabase
    .from("mensajes")
    .select("id, de, para, texto, created_at, leido_en")
    .or(`de.eq.${me},para.eq.${me}`)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Row[]>();

  const byPeer = new Map<string, { last: Row; unread: number }>();
  for (const m of data ?? []) {
    const peer = m.de === me ? m.para : m.de;
    const entry = byPeer.get(peer) ?? { last: m, unread: 0 };
    if (m.para === me && !m.leido_en) entry.unread += 1;
    byPeer.set(peer, entry);
  }
  const peers = await people([...byPeer.keys()]);
  return peers
    .map((peer) => {
      const { last, unread } = byPeer.get(peer.id)!;
      return { peer, last: last.texto, lastAt: last.created_at, unread, mine: last.de === me };
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
    .is("leido_en", null);
  return count ?? 0;
}
