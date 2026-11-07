"use client";

import { Button } from "@/components/ui/button";
import { community } from "@/lib/mock-data";
import { draftWhen, type DraftActivity } from "@/lib/agenda/draft";

/** "Avisar a mis vecinos": usa el menú de compartir del sistema y, si no existe, WhatsApp. */
export function NotifyNeighborsButton({ draft }: { draft: DraftActivity }) {
  const text = `${draft.name}\n${draftWhen(draft)} · ${draft.place}\n\nInscríbete en Puerta Abierta:\n${community.publicUrl}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: draft.name, text });
        return;
      } catch {
        /* cancelado por el usuario */
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Button variant="secondary" className="rounded-[80px]" onClick={share}>
      Avisar a mis vecinos
    </Button>
  );
}
