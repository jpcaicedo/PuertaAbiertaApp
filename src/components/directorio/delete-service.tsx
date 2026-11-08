"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { deleteService } from "@/lib/directory/actions";

/** Botón de papelera + hoja de confirmación para quitar un servicio propio del Directorio. */
export function DeleteServiceButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [deleting, startDelete] = React.useTransition();

  function confirm() {
    setError(undefined);
    startDelete(async () => {
      const result = await deleteService(slug);
      if (!result.ok) return setError("No pudimos eliminarlo. Inténtalo de nuevo.");
      setOpen(false);
      router.replace("/directorio");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Eliminar «${title}»`}
        className="grid size-[52px] shrink-0 cursor-pointer place-items-center rounded-card bg-error/10 text-error transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Trash2 className="size-5" strokeWidth={2} aria-hidden />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="gap-4 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex w-full justify-center">
            <div className="h-[5px] w-10 rounded-[3px] bg-handle" />
          </div>
          <div className="flex w-full flex-col gap-1.5 px-1">
            <BottomSheetTitle className="text-headline font-bold">¿Eliminar este servicio?</BottomSheetTitle>
            <BottomSheetDescription className="text-text-tertiary">
              «{title}» deja de aparecer en el Directorio. Los mensajes que ya te enviaron siguen en tu bandeja.
            </BottomSheetDescription>
          </div>
          {error && (
            <p role="alert" className="w-full text-caption text-error">
              {error}
            </p>
          )}
          <Button onClick={confirm} disabled={deleting} className="bg-error text-text-on-dark hover:bg-error/90">
            {deleting ? "Eliminando…" : "Sí, eliminar"}
          </Button>
          <BottomSheetClose asChild>
            <Button variant="link">Cancelar</Button>
          </BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
