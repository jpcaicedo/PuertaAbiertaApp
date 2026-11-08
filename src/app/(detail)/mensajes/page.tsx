import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { Avatar } from "@/components/directorio/ui";
import { ListGroup, PageHeading } from "@/components/perfil/ui";
import { chatTime, getInbox } from "@/lib/messages/queries";
import { colombiaToday } from "@/lib/agenda/today";
import { cn } from "@/lib/utils";
import { ReadTicks } from "@/components/directorio/read-ticks";

export const metadata = { title: "Mensajes · Puerta Abierta" };
export const dynamic = "force-dynamic";

/** "5:12 p. m." si es de hoy; "3 nov." si es de otro día. */
function when(iso: string) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));
  if (day === colombiaToday()) return chatTime(iso);
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" }).format(new Date(iso));
}

/** Bandeja de mensajes entre vecinos (se entra desde Perfil). */
export default async function MensajesPage() {
  const inbox = await getInbox();
  // Modo demo: no hay mensajería real.
  if (!inbox) redirect("/directorio");

  return (
    <Screen>
      <ScreenHeader backHref="/perfil" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <PageHeading title="Mensajes" description="Tus conversaciones con vecinos del conjunto." />
        {inbox.length ? (
          <ListGroup label="Conversaciones">
            {inbox.map((c) => (
              <li key={c.peer.id}>
                <Link
                  href={`/mensajes/${c.peer.id}`}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
                    c.unread > 0 && "bg-unread",
                  )}
                >
                  <Avatar name={c.peer.name} src={c.peer.avatar} size={48} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className={cn("flex-1 truncate text-callout text-text", c.unread ? "font-bold" : "font-semibold")}>
                        {c.peer.name}
                      </span>
                      <span className="shrink-0 text-overline text-text-tertiary">{when(c.lastAt)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex min-w-0 flex-1 items-center gap-1 text-label text-text-tertiary">
                        {c.mine && !c.peer.demo && <ReadTicks read={c.lastRead} className="shrink-0" />}
                        <span className="truncate">
                          {c.mine ? "Tú: " : ""}
                          {c.last}
                        </span>
                      </span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-overline font-bold text-white">
                          <span className="sr-only">Sin leer: </span>
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ListGroup>
        ) : (
          <div className="flex w-full flex-col items-center gap-2.5 px-2.5 pt-12 text-center">
            <span aria-hidden className="inline-flex rounded-[40px] bg-brand-soft p-[18px] text-brand">
              <MessageCircle className="size-8" strokeWidth={2} />
            </span>
            <p className="text-heading font-semibold text-text">Aún no tienes mensajes</p>
            <p className="max-w-[310px] text-body text-text-secondary">
              Escríbele a un vecino desde el Directorio y la conversación aparece aquí.
            </p>
            <Link href="/directorio" className="pt-1 text-body font-semibold text-brand">
              Ir al Directorio
            </Link>
          </div>
        )}
      </div>
    </Screen>
  );
}
