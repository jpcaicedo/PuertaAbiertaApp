"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Phone, SendHorizontal, ShieldCheck } from "lucide-react";
import type { ChatMessage } from "@/lib/directory/data";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";

type ChatScreenProps = {
  backHref: string;
  name: string;
  avatar?: string;
  subtitle: string;
  phone?: string;
  initialMessages: ChatMessage[];
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
 * TODO: conectar con la mensajería real (WebSocket o polling).
 */
export function ChatScreen({ backHref, name, avatar, subtitle, phone, initialMessages }: ChatScreenProps) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [draft, setDraft] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: String(Date.now()), mine: true, text, time: nowLabel() }]);
    setDraft("");
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
        <ol aria-label={`Conversación con ${name}`} className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id} className={cn("flex max-w-[278px] flex-col gap-1", m.mine ? "items-end self-end" : "items-start self-start")}>
              <p
                className={cn(
                  "rounded-card px-3.5 py-2.5 text-body",
                  m.mine ? "bg-brand text-white" : "bg-note text-text",
                )}
              >
                <span className="sr-only">{m.mine ? "Tú: " : `${name}: `}</span>
                {m.text}
              </p>
              <span className="text-overline text-text-tertiary">{m.time}</span>
            </li>
          ))}
        </ol>
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex shrink-0 items-center gap-2.5 px-4 pt-2 pb-[max(30px,calc(var(--safe-bottom)+12px))]">
        <label htmlFor="mensaje" className="sr-only">
          Escribe un mensaje
        </label>
        <input
          id="mensaje"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje"
          autoComplete="off"
          enterKeyHint="send"
          className="h-[46px] min-w-0 flex-1 rounded-full bg-note px-4 text-body text-text outline-none placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-brand"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Enviar"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-[transform,opacity] active:scale-95 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <SendHorizontal className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </form>
    </main>
  );
}
