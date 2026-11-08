"use client";

import * as React from "react";
import { Link as LinkIcon, Lock, Mail, MessageCircle, MessageSquare, Share, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { community, type Notice } from "@/lib/mock-data";
import { shareTargets } from "@/lib/share";
import { cn } from "@/lib/utils";

type ShareNoticeProps = {
  notice: Notice;
  /**
   * inline → botón de texto pequeño de la tarjeta de Inicio (I1).
   * block  → botón secundario de ancho completo del detalle (I2).
   */
  variant: "inline" | "block";
  className?: string;
};

/** Botón "Compartir" + hoja I3 · Compartir aviso (484:5023). */
export function ShareNotice({ notice, variant, className }: ShareNoticeProps) {
  const [open, setOpen] = React.useState(false);
  // Avisos marcados "Solo residentes" por la administración.
  if (notice.shareable === false) return null;

  return (
    <>
      {variant === "inline" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "relative z-10 -my-0.5 -mr-1 inline-flex cursor-pointer items-center gap-1 rounded-[16px] py-0.5 pr-1 pl-2 text-caption font-semibold text-brand",
            "transition-colors hover:bg-brand-soft/60 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-brand",
            className,
          )}
        >
          <Share className="size-4" strokeWidth={2} aria-hidden />
          Compartir
        </button>
      ) : (
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
          className={cn("px-4 text-[16px] leading-6 font-semibold text-brand", className)}
        >
          <Share strokeWidth={2} aria-hidden />
          Compartir aviso
        </Button>
      )}
      <ShareNoticeSheet notice={notice} open={open} onOpenChange={setOpen} />
    </>
  );
}

type SheetProps = { notice: Notice; open: boolean; onOpenChange: (open: boolean) => void };

function ShareNoticeSheet({ notice, open, onOpenChange }: SheetProps) {
  const targets = shareTargets(notice);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(targets.link);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles: no hacemos nada visible.
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-h-[calc(100dvh-24px)] gap-4 overflow-y-auto pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
        {/* Agarradera 40×5 */}
        <div className="flex w-full justify-center" aria-hidden>
          <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
        </div>

        <div className="flex w-full flex-col gap-1.5 px-1 pt-1">
          <BottomSheetTitle className="text-headline font-bold">Compartir aviso</BottomSheetTitle>
          <BottomSheetDescription className="text-text-tertiary">Así le llega a quien no tiene la app.</BottomSheetDescription>
        </div>

        {/* Vista previa del mensaje */}
        <div className="w-full rounded-[18px] bg-preview p-3.5">
          <div className="flex w-full flex-col gap-2 rounded-[4px_14px_14px_14px] bg-surface px-3.5 py-3">
            <p className="text-[16px] leading-6 font-bold text-text">{notice.title}</p>
            <p className="text-caption text-text-tertiary">{notice.author}</p>
            <p className="text-body text-text">{notice.shareSummary}</p>
            <p className="text-label text-text-tertiary">
              Recibe todos los avisos del conjunto en Puerta Abierta:
              <br />
              <span className="font-semibold text-brand">{community.publicUrlLabel}</span>
            </p>
          </div>
        </div>

        {/* Apps */}
        <div className="flex w-full items-start justify-between">
          <ShareTarget href={targets.whatsapp} icon={MessageCircle} label="WhatsApp" featured external />
          <ShareTarget href={targets.sms} icon={MessageSquare} label="Mensajes" />
          <ShareTarget href={targets.email} icon={Mail} label="Correo" />
          <ShareTarget
            onClick={copyLink}
            icon={copied ? Check : LinkIcon}
            label={copied ? "¡Copiado!" : "Copiar enlace"}
          />
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? "Enlace copiado al portapapeles" : ""}
        </span>

        <p className="flex w-full items-center gap-2 px-1 text-caption text-text-tertiary">
          <Lock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          Solo se comparte el aviso. Tus datos no se incluyen.
        </p>

        <BottomSheetClose asChild>
          <Button variant="link">Cancelar</Button>
        </BottomSheetClose>
      </BottomSheetContent>
    </BottomSheet>
  );
}

type ShareTargetProps = {
  icon: LucideIcon;
  label: string;
  featured?: boolean;
  external?: boolean;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Círculo 60px (padding 18 + icono 24) + etiqueta 13/18 Medium, gap 8. */
function ShareTarget({ icon: Icon, label, featured, external, href, onClick }: ShareTargetProps) {
  const circle = cn(
    "grid size-[60px] place-items-center rounded-[30px] transition-[transform,filter] duration-150 group-hover:brightness-95 group-active:scale-95",
    featured ? "bg-whatsapp text-white" : "bg-surface-muted text-ink",
  );
  const classes =
    "group flex min-w-[60px] cursor-pointer flex-col items-center gap-2 rounded-2xl text-center text-caption font-medium text-text outline-none focus-visible:ring-2 focus-visible:ring-brand";
  const content = (
    <>
      <span className={circle}>
        <Icon className="size-6" strokeWidth={2} aria-hidden />
      </span>
      {label}
    </>
  );
  return href ? (
    <a href={href} className={classes} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
