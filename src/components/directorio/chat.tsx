"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Info, Phone, SendHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import type { ChatMessage } from "@/lib/directory/data";
import { deleteConversation, deleteMessage, markConversationRead, sendMessage } from "@/lib/messages/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";

type ChatScreenProps = {
  backHref: string;
  name: string;
  avatar?: string;
  subtitle: string;
  phone?: string;
  initialMessages: ChatMessage[];
  /**
   * Conversación real en Supabase: quién soy y con quién hablo. Sin esto, el chat es de ejemplo
   * (los mensajes solo se ven en pantalla).
   */
  remote?: { me: string; peerId: string; acceptsMessages: boolean; productId?: string; demo?: boolean };
};

function nowLabel() {
  const d = new Date();
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

/**
 * D4 · Mensaje a Camila / D4b · Mensaje al vendedor.
 * Cabecera con avatar 40, aviso de privacidad, burbujas (mías azules, de la otra persona #F2F4F6)
 * y caja para escribir con botón de enviar de 44.
 * Tocar una burbuja permite eliminar ese mensaje; la papelera de arriba vacía la conversación.
 */
export function ChatScreen({ backHref, name, avatar, subtitle, phone, initialMessages, remote }: ChatScreenProps) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string>();
  const endRef = React.useRef<HTMLDivElement>(null);
  const blocked = remote ? !remote.acceptsMessages : false;
  const [selected, setSelected] = React.useState<ChatMessage | null>(null);
  const [clearOpen, setClearOpen] = React.useState(false);
  const firstName = name.split(/\s+/)[0];

  function removeMessage(m: ChatMessage) {
    setMessages((list) => list.filter((x) => x.id !== m.id));
    setSelected(null);
    if (remote && !m.id.startsWith("tmp-")) {
      void deleteMessage(m.id).then((r) => {
        if (!r.ok) {
          setMessages((list) => [...list, m]);
          setError("No pudimos eliminar el mensaje. Inténtalo de nuevo.");
        }
      });
    }
  }

  function clearConversation() {
    const before = messages;
    setMessages([]);
    setClearOpen(false);
    if (remote) {
      void deleteConversation(remote.peerId).then((r) => {
        if (!r.ok) {
          setMessages(before);
          setError("No pudimos vaciar la conversación. Inténtalo de nuevo.");
        }
      });
    }
  }

  // Mensajes nuevos en vivo: Supabase avisa cuando el otro vecino escribe.
  const me = remote?.me;
  const peerId = remote?.peerId;
  React.useEffect(() => {
    if (!me || !peerId || peerId.startsWith("demo-")) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${me}-${peerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes", filter: `para=eq.${me}` },
        (payload) => {
          const m = payload.new as { id: string; de: string; texto: string };
          if (m.de !== peerId) return;
          setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, { id: m.id, mine: false, text: m.texto, time: nowLabel() }]));
          void markConversationRead(peerId);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [me, peerId]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, mine: true, text, time: nowLabel() }]);
    setDraft("");
    setError(undefined);
    if (!remote) return;
    void sendMessage(remote.peerId, text, remote.productId).then((r) => {
      if (r.ok) {
        setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, id: r.id } : x)));
      } else {
        // No se envió: se quita la burbuja y se devuelve el texto a la caja.
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setDraft(text);
        setError(r.error);
      }
    });
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-bg">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-step-pending pt-[max(44px,env(safe-area-inset-top))] pr-4 pb-2.5 pl-2">
        <Link
          href={backHref}
          aria-label="Atrás"
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-brand-soft/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronLeft className="size-6" strokeWidth={2} aria-hidden />
        </Link>
        <Avatar name={name} src={avatar} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-body font-semibold text-text">{name}</h1>
          <p className="truncate text-caption text-text-secondary">{subtitle}</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            aria-label="Vaciar conversación"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-text-secondary transition-colors hover:bg-error/10 hover:text-error outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Trash2 className="size-5" strokeWidth={2} aria-hidden />
          </button>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            aria-label={`Llamar a ${name}`}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-success-soft text-success outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Phone className="size-5" strokeWidth={2} aria-hidden />
          </a>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-[30px] pb-4">
        <p className="mb-4 flex w-fit max-w-full items-center gap-1.5 rounded-[10px] bg-note px-3 py-1.5 text-overline text-text-secondary">
          <ShieldCheck className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          Solo vecinos verificados. Tu teléfono no se comparte.
        </p>
        {remote?.demo && (
          <p className="mb-4 flex w-fit max-w-full items-start gap-1.5 rounded-[10px] bg-note px-3 py-1.5 text-overline text-text-secondary">
            <Info className="mt-px size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {firstName} es una cuenta de ejemplo: tus mensajes se guardan, pero nadie va a responder.
          </p>
        )}
        <ol aria-label={`Conversación con ${name}`} className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id} className={cn("flex max-w-[278px] flex-col gap-1", m.mine ? "items-end self-end" : "items-start self-start")}>
              <button
                type="button"
                onClick={() => setSelected(m)}
                aria-haspopup="dialog"
                className={cn(
                  "cursor-pointer rounded-card px-3.5 py-2.5 text-left text-body transition-opacity active:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  m.mine ? "bg-brand text-white" : "bg-note text-text",
                )}
              >
                <span className="sr-only">{m.mine ? "Tú: " : `${name}: `}</span>
                {m.text}
                <span className="sr-only">. Toca para eliminar.</span>
              </button>
              <span className="text-overline text-text-tertiary">{m.time}</span>
            </li>
          ))}
        </ol>
        <div ref={endRef} />
      </div>

      {(error || blocked) && (
        <p role="alert" className="shrink-0 px-5 pt-2 text-caption text-error">
          {error ?? `${name.split(/\s+/)[0]} no recibe mensajes por la app en este momento.`}
        </p>
      )}
      <form onSubmit={send} className="flex shrink-0 items-center gap-2.5 px-4 pt-2 pb-[max(30px,calc(var(--safe-bottom)+12px))]">
        <label htmlFor="mensaje" className="sr-only">
          Escribe un mensaje
        </label>
        <input
          id="mensaje"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje"
          disabled={blocked}
          maxLength={1000}
          autoComplete="off"
          enterKeyHint="send"
          className="h-[46px] min-w-0 flex-1 rounded-full bg-note px-4 text-body text-text outline-none placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-brand"
        />
        <button
          type="submit"
          disabled={!draft.trim() || blocked}
          aria-label="Enviar"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-[transform,opacity] active:scale-95 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <SendHorizontal className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </form>

      {/* Eliminar un mensaje */}
      <BottomSheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <BottomSheetContent className="gap-4 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex w-full justify-center">
            <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
          </div>
          <div className="flex w-full flex-col gap-1.5 px-1">
            <BottomSheetTitle className="text-headline font-bold">¿Eliminar este mensaje?</BottomSheetTitle>
            <BottomSheetDescription className="text-text-tertiary">
              {selected?.mine
                ? remote?.demo || !remote
                  ? "Se borra de esta conversación."
                  : `Se borra para ti y para ${firstName}.`
                : `Deja de verse en tu chat. ${firstName} lo sigue viendo.`}
            </BottomSheetDescription>
          </div>
          {selected && (
            <p className="line-clamp-3 w-full rounded-card bg-note px-3.5 py-2.5 text-body text-text">{selected.text}</p>
          )}
          <Button className="bg-error text-text-on-dark hover:bg-error/90" onClick={() => selected && removeMessage(selected)}>
            Eliminar mensaje
          </Button>
          <BottomSheetClose asChild>
            <Button variant="link">Cancelar</Button>
          </BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>

      {/* Vaciar la conversación */}
      <BottomSheet open={clearOpen} onOpenChange={setClearOpen}>
        <BottomSheetContent className="gap-4 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex w-full justify-center">
            <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
          </div>
          <div className="flex w-full flex-col gap-1.5 px-1">
            <BottomSheetTitle className="text-headline font-bold">¿Vaciar la conversación con {firstName}?</BottomSheetTitle>
            <BottomSheetDescription className="text-text-tertiary">
              {remote && !remote.demo
                ? `Se borran los mensajes que enviaste y dejas de ver los que te llegaron. ${firstName} conserva los suyos.`
                : "Se borran todos los mensajes de esta conversación."}
            </BottomSheetDescription>
          </div>
          <Button className="bg-error text-text-on-dark hover:bg-error/90" onClick={clearConversation}>
            Vaciar conversación
          </Button>
          <BottomSheetClose asChild>
            <Button variant="link">Cancelar</Button>
          </BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>
    </main>
  );
}
