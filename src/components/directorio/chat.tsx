"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Copy, Info, Phone, SendHorizontal, ShieldCheck, Trash2, UserX, Users } from "lucide-react";
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
import { subscribeToChanges } from "@/lib/supabase/realtime";
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
 * Como en WhatsApp: mantener presionado un mensaje abre las opciones (copiar, eliminar para mí,
 * eliminar para todos). La papelera de arriba vacía el chat solo para quien lo hace.
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

  /** Con un vecino real, los mensajes propios se pueden borrar para los dos. */
  const canDeleteForAll = (m: ChatMessage) => m.mine && !!remote && !remote.demo && !m.id.startsWith("tmp-");

  function removeMessage(m: ChatMessage, scope: "me" | "all") {
    setMessages((list) => list.filter((x) => x.id !== m.id));
    setSelected(null);
    if (remote && !m.id.startsWith("tmp-")) {
      // Con un vecino de ejemplo nadie más tiene el mensaje: se borra del todo.
      void deleteMessage(m.id, remote.demo && m.mine ? "all" : scope).then((r) => {
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
    return subscribeToChanges(`chat-${me}-${peerId}`, (channel) =>
      channel
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
      // "Eliminar para todos" del otro vecino: la burbuja desaparece también aquí.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "mensajes" }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (id) setMessages((list) => list.filter((x) => x.id !== id));
      })
    );
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
              <Bubble message={m} name={name} selected={selected?.id === m.id} onOpenMenu={() => setSelected(m)} />
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

      {/* Opciones del mensaje (mantener presionado) */}
      <BottomSheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <BottomSheetContent className="gap-3 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex w-full justify-center">
            <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
          </div>
          <BottomSheetTitle className="sr-only">Opciones del mensaje</BottomSheetTitle>
          <BottomSheetDescription className="sr-only">Copia o elimina el mensaje.</BottomSheetDescription>
          {selected && (
            <p
              className={cn(
                "line-clamp-3 max-w-[85%] rounded-card px-3.5 py-2.5 text-body",
                selected.mine ? "self-end bg-brand text-white" : "self-start bg-note text-text",
              )}
            >
              {selected.text}
            </p>
          )}
          <ul className="flex w-full flex-col overflow-hidden rounded-card bg-surface-muted">
            <MenuItem
              icon={Copy}
              label="Copiar"
              onClick={() => {
                if (selected) void navigator.clipboard?.writeText(selected.text).catch(() => undefined);
                setSelected(null);
              }}
            />
            <MenuItem
              icon={UserX}
              label={remote?.demo || !remote ? "Eliminar" : "Eliminar para mí"}
              hint={remote && !remote.demo ? `${firstName} lo sigue viendo` : undefined}
              danger
              onClick={() => selected && removeMessage(selected, "me")}
            />
            {selected && canDeleteForAll(selected) && (
              <MenuItem
                icon={Users}
                label="Eliminar para todos"
                hint={`Se borra también del chat de ${firstName}`}
                danger
                onClick={() => removeMessage(selected, "all")}
              />
            )}
          </ul>
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
                ? `La conversación desaparece solo de tu chat. ${firstName} la conserva.`
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

/** Una fila del menú de opciones del mensaje. */
function MenuItem({
  icon: Icon,
  label,
  hint,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <li className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-note outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <Icon className={cn("size-5 shrink-0", danger ? "text-error" : "text-text-secondary")} strokeWidth={2} />
        <span className="flex flex-col">
          <span className={cn("text-body font-medium", danger ? "text-error" : "text-text")}>{label}</span>
          {hint && <span className="text-overline text-text-tertiary">{hint}</span>}
        </span>
      </button>
    </li>
  );
}

/**
 * Burbuja de mensaje. Mantener presionado (o clic derecho, o Enter con el teclado) abre las opciones;
 * un toque corto no hace nada, como en WhatsApp.
 */
function Bubble({
  message: m,
  name,
  selected,
  onOpenMenu,
}: {
  message: ChatMessage;
  name: string;
  selected: boolean;
  onOpenMenu: () => void;
}) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = React.useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  React.useEffect(() => cancel, []);

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        start.current = { x: e.clientX, y: e.clientY };
        timer.current = setTimeout(() => {
          timer.current = null;
          navigator.vibrate?.(15);
          onOpenMenu();
        }, 450);
      }}
      onPointerMove={(e) => {
        // Si el dedo se mueve (está desplazando la conversación), no es un toque largo.
        if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) cancel();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => {
        e.preventDefault();
        cancel();
        onOpenMenu();
      }}
      onClick={(e) => {
        // e.detail === 0: activado con el teclado (Enter o espacio).
        if (e.detail === 0) onOpenMenu();
      }}
      style={{ WebkitTouchCallout: "none" }}
      className={cn(
        "cursor-pointer rounded-card px-3.5 py-2.5 text-left text-body select-none transition-[opacity,transform] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        m.mine ? "bg-brand text-white" : "bg-note text-text",
        selected && "ring-2 ring-brand/60 ring-offset-2 ring-offset-bg",
      )}
    >
      <span className="sr-only">{m.mine ? "Tú: " : `${name}: `}</span>
      {m.text}
      <span className="sr-only">. Mantén presionado para ver las opciones.</span>
    </button>
  );
}
