"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  ChevronLeft,
  Copy,
  Info,
  Mic,
  Pause,
  Phone,
  Play,
  SendHorizontal,
  ShieldCheck,
  Trash2,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import type { ChatMessage } from "@/lib/directory/data";
import { deleteConversation, deleteMessage, markConversationRead, sendMessage, type Attachment } from "@/lib/messages/actions";
import { preparePhoto, recorderMime, signedChatUrl, uploadChatFile } from "@/lib/messages/media";
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
 * Como en WhatsApp: se pueden mandar fotos (cámara) y audios (mantener presionado el micrófono);
 * mantener presionado un mensaje abre las opciones (copiar, eliminar para mí, eliminar para todos).
 * La papelera de arriba vacía el chat solo para quien lo hace.
 */
export function ChatScreen({ backHref, name, avatar, subtitle, phone, initialMessages, remote }: ChatScreenProps) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string>();
  const endRef = React.useRef<HTMLDivElement>(null);
  const blocked = remote ? !remote.acceptsMessages : false;
  const [selected, setSelected] = React.useState<ChatMessage | null>(null);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [viewer, setViewer] = React.useState<string | null>(null);
  const photoInput = React.useRef<HTMLInputElement>(null);
  const firstName = name.split(/\s+/)[0];

  /**
   * Manda una foto o un audio: aparece de una en el chat (con la vista previa local) mientras sube.
   * Con un vecino de ejemplo o en modo demo, se queda solo en pantalla.
   */
  async function sendMedia(kind: "photo" | "audio", blob: Blob, ext: string, contentType: string, duration?: number) {
    setError(undefined);
    const tempId = `tmp-${Date.now()}`;
    const local = URL.createObjectURL(blob);
    setMessages((m) => [...m, { id: tempId, mine: true, text: "", time: nowLabel(), kind, media: local, duration, sending: !!remote }]);
    if (!remote) return;
    const path = await uploadChatFile(blob, ext, contentType);
    const fail = (msg: string) => {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setError(msg);
    };
    if (!path) return fail(kind === "photo" ? "No pudimos subir la foto. Inténtalo de nuevo." : "No pudimos enviar el audio. Inténtalo de nuevo.");
    const attachment: Attachment = { kind, path, duration };
    const r = await sendMessage(remote.peerId, "", remote.productId, attachment);
    if (!r.ok) return fail(r.error);
    setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, id: r.id, path, sending: false } : x)));
  }

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Elige una imagen.");
    try {
      const blob = await preparePhoto(file);
      await sendMedia("photo", blob, "jpg", "image/jpeg");
    } catch {
      setError("No pudimos leer esa imagen. Prueba con otra.");
    }
  }

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
          const m = payload.new as { id: string; de: string; texto: string; tipo?: string; adjunto?: string | null; duracion?: number | null };
          if (m.de !== peerId) return;
          void (async () => {
            const media = m.adjunto ? await signedChatUrl(m.adjunto) : undefined;
            const kind = m.tipo === "foto" ? "photo" : m.tipo === "audio" ? "audio" : "text";
            const incoming: ChatMessage = {
              id: m.id,
              mine: false,
              text: m.texto,
              time: nowLabel(),
              kind,
              media,
              duration: m.duracion ?? undefined,
            };
            setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, incoming]));
          })();
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
              <Bubble
                message={m}
                name={name}
                selected={selected?.id === m.id}
                onOpenMenu={() => !m.sending && setSelected(m)}
                onOpenPhoto={() => m.media && setViewer(m.media)}
              />
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
      <form onSubmit={send} className="relative flex shrink-0 items-center gap-2 px-4 pt-2 pb-[max(30px,calc(var(--safe-bottom)+12px))]">
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={blocked}
          aria-label="Enviar una foto"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-text-secondary transition-colors hover:bg-note disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Camera className="size-[22px]" strokeWidth={2} aria-hidden />
        </button>
        <input ref={photoInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={pickPhoto} />
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
        {draft.trim() ? (
          <button
            type="submit"
            disabled={blocked}
            aria-label="Enviar"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-[transform,opacity] active:scale-95 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <SendHorizontal className="size-5" strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <MicButton
            disabled={blocked}
            onRecorded={(blob, ext, mime, seconds) => void sendMedia("audio", blob, ext, mime, seconds)}
            onError={setError}
          />
        )}
      </form>

      {/* Foto en grande */}
      {viewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto"
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-3"
          onClick={() => setViewer(null)}
        >
          <button
            type="button"
            onClick={() => setViewer(null)}
            aria-label="Cerrar foto"
            className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 grid size-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-6" strokeWidth={2} aria-hidden />
          </button>
          <div className="relative h-[80dvh] w-full max-w-[430px]">
            <Image src={viewer} alt="Foto de la conversación" fill unoptimized className="object-contain" />
          </div>
        </div>
      )}

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
              {selected.kind === "photo" ? "Foto" : selected.kind === "audio" ? "Mensaje de voz" : selected.text}
            </p>
          )}
          <ul className="flex w-full flex-col overflow-hidden rounded-card bg-surface-muted">
            {(!selected?.kind || selected.kind === "text") && (
            <MenuItem
              icon={Copy}
              label="Copiar"
              onClick={() => {
                if (selected) void navigator.clipboard?.writeText(selected.text).catch(() => undefined);
                setSelected(null);
              }}
            />
            )}
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

/** "0:07" */
function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Burbuja de mensaje (texto, foto o audio). Mantener presionado (o clic derecho, o Enter con el
 * teclado en los de texto) abre las opciones; un toque corto en una foto la abre en grande.
 */
function Bubble({
  message: m,
  name,
  selected,
  onOpenMenu,
  onOpenPhoto,
}: {
  message: ChatMessage;
  name: string;
  selected: boolean;
  onOpenMenu: () => void;
  onOpenPhoto: () => void;
}) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const longPressed = React.useRef(false);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  React.useEffect(() => cancel, []);

  const press = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      longPressed.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        timer.current = null;
        longPressed.current = true;
        navigator.vibrate?.(15);
        onOpenMenu();
      }, 450);
    },
    onPointerMove: (e: React.PointerEvent) => {
      // Si el dedo se mueve (está desplazando la conversación), no es un toque largo.
      if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      cancel();
      onOpenMenu();
    },
  };
  const who = <span className="sr-only">{m.mine ? "Tú: " : `${name}: `}</span>;
  const ring = selected && "ring-2 ring-brand/60 ring-offset-2 ring-offset-bg";

  if (m.kind === "photo") {
    return (
      <div {...press} style={{ WebkitTouchCallout: "none" }} className={cn("relative rounded-card select-none", ring)}>
        <button
          type="button"
          onClick={() => !longPressed.current && onOpenPhoto()}
          aria-label={`${m.mine ? "Tu foto" : `Foto de ${name}`}. Toca para verla en grande.`}
          className="relative block size-[220px] cursor-pointer overflow-hidden rounded-card bg-note outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {m.media ? (
            <Image src={m.media} alt="" fill unoptimized draggable={false} className={cn("object-cover", m.sending && "opacity-60")} />
          ) : (
            <span className="grid h-full place-items-center text-caption text-text-tertiary">Foto no disponible</span>
          )}
          {m.sending && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="size-8 animate-spin rounded-full border-[3px] border-white/40 border-t-white" aria-label="Enviando" />
            </span>
          )}
        </button>
      </div>
    );
  }

  if (m.kind === "audio") {
    return (
      <div
        {...press}
        style={{ WebkitTouchCallout: "none" }}
        className={cn("rounded-card px-2.5 py-2 select-none", m.mine ? "bg-brand text-white" : "bg-note text-text", ring)}
      >
        {who}
        <AudioPlayer src={m.media} duration={m.duration} mine={m.mine} sending={m.sending} />
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      {...press}
      onClick={(e) => {
        // e.detail === 0: activado con el teclado (Enter o espacio).
        if (e.detail === 0) onOpenMenu();
      }}
      style={{ WebkitTouchCallout: "none" }}
      className={cn(
        "cursor-pointer rounded-card px-3.5 py-2.5 text-left text-body select-none transition-[opacity,transform] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        m.mine ? "bg-brand text-white" : "bg-note text-text",
        ring,
      )}
    >
      {who}
      {m.text}
      <span className="sr-only">. Mantén presionado para ver las opciones.</span>
    </button>
  );
}

/** Mensaje de voz: reproducir/pausar, barra de avance y duración. */
function AudioPlayer({ src, duration, mine, sending }: { src?: string; duration?: number; mine: boolean; sending?: boolean }) {
  const audio = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const total = duration ?? 0;
  const progress = total ? Math.min(1, current / total) : 0;

  function toggle() {
    const a = audio.current;
    if (!a || !src) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  }

  return (
    <div className="flex w-[220px] items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        disabled={!src || sending}
        aria-label={playing ? "Pausar mensaje de voz" : "Reproducir mensaje de voz"}
        className={cn(
          "grid size-10 shrink-0 cursor-pointer place-items-center rounded-full disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          mine ? "bg-white/20 text-white focus-visible:ring-white" : "bg-brand text-white focus-visible:ring-brand",
        )}
      >
        {sending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : playing ? (
          <Pause className="size-4" strokeWidth={2.5} aria-hidden />
        ) : (
          <Play className="ml-0.5 size-4" strokeWidth={2.5} aria-hidden />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cn("h-1 w-full overflow-hidden rounded-full", mine ? "bg-white/30" : "bg-border")} aria-hidden>
          <div className={cn("h-full rounded-full", mine ? "bg-white" : "bg-brand")} style={{ width: `${progress * 100}%` }} />
        </div>
        <span className={cn("text-overline", mine ? "text-white/80" : "text-text-tertiary")}>
          {clock(playing || current ? current : total)}
        </span>
      </div>
      {src && (
        <audio
          ref={audio}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrent(0);
          }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        />
      )}
    </div>
  );
}

const MAX_AUDIO_SECONDS = 120;

/**
 * Micrófono como en WhatsApp: mantener presionado graba; al soltar se envía;
 * deslizar a la izquierda cancela. Un toque corto explica cómo usarlo.
 */
function MicButton({
  disabled,
  onRecorded,
  onError,
}: {
  disabled?: boolean;
  onRecorded: (blob: Blob, ext: string, mime: string, seconds: number) => void;
  onError: (message: string) => void;
}) {
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [cancelling, setCancelling] = React.useState(false);
  const recorder = React.useRef<MediaRecorder | null>(null);
  const chunks = React.useRef<Blob[]>([]);
  const startedAt = React.useRef(0);
  const startX = React.useRef(0);
  const cancelled = React.useRef(false);
  const tick = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pressing = React.useRef(false);

  const stopTracks = () => recorder.current?.stream.getTracks().forEach((t) => t.stop());

  async function begin(e: React.PointerEvent) {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pressing.current = true;
    startX.current = e.clientX;
    cancelled.current = false;
    setCancelling(false);
    const format = recorderMime();
    if (!format || !navigator.mediaDevices?.getUserMedia) {
      return onError("Este navegador no permite grabar audio.");
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return onError("Permite el uso del micrófono para mandar audios.");
    }
    // Soltó antes de que el permiso respondiera.
    if (!pressing.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const rec = new MediaRecorder(stream, { mimeType: format.mime });
    chunks.current = [];
    rec.ondataavailable = (ev) => ev.data.size && chunks.current.push(ev.data);
    rec.onstop = () => {
      stopTracks();
      const seconds = (Date.now() - startedAt.current) / 1000;
      if (cancelled.current || seconds < 1) return;
      const type = format.mime.split(";")[0];
      onRecorded(new Blob(chunks.current, { type }), format.ext, type, Math.min(seconds, MAX_AUDIO_SECONDS));
    };
    recorder.current = rec;
    startedAt.current = Date.now();
    rec.start();
    setElapsed(0);
    setRecording(true);
    navigator.vibrate?.(20);
    tick.current = setInterval(() => {
      const s = (Date.now() - startedAt.current) / 1000;
      setElapsed(s);
      if (s >= MAX_AUDIO_SECONDS) finish();
    }, 200);
  }

  function finish() {
    pressing.current = false;
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setRecording(false);
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null;
  }

  React.useEffect(
    () => () => {
      cancelled.current = true;
      finish();
    },
    [],
  );

  return (
    <>
      {recording && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 right-[4.25rem] left-4 z-10 flex h-[46px] items-center gap-2.5 rounded-full bg-note px-4"
        >
          <span className="size-2.5 animate-pulse rounded-full bg-error" aria-hidden />
          <span className="text-body font-medium text-text tabular-nums">{clock(elapsed)}</span>
          <span className={cn("ml-auto text-caption", cancelling ? "font-semibold text-error" : "text-text-tertiary")}>
            {cancelling ? "Suelta para cancelar" : "‹ Desliza para cancelar"}
          </span>
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        aria-label="Mantén presionado para grabar un mensaje de voz"
        onPointerDown={(e) => void begin(e)}
        onPointerMove={(e) => {
          if (!recording) return;
          const away = startX.current - e.clientX > 80;
          cancelled.current = away;
          setCancelling(away);
        }}
        onPointerUp={() => {
          const quick = !recording;
          finish();
          if (quick && !disabled) onError("Mantén presionado el micrófono para grabar y suelta para enviar.");
        }}
        onPointerCancel={() => {
          cancelled.current = true;
          finish();
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: "none" }}
        className={cn(
          "grid size-11 shrink-0 cursor-pointer touch-none place-items-center rounded-full text-white transition-[transform,background-color] select-none disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          recording ? (cancelling ? "scale-125 bg-error" : "scale-125 bg-brand") : "bg-brand active:scale-95",
        )}
      >
        <Mic className="size-5" strokeWidth={2} aria-hidden />
      </button>
    </>
  );
}
