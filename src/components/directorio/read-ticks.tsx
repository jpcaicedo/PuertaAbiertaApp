import { Check, CheckCheck, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estado de un mensaje propio, como en WhatsApp:
 * reloj = enviándose · ✓ gris = enviado · ✓✓ azul = el otro vecino ya lo vio.
 */
export function ReadTicks({ sending, read, className }: { sending?: boolean; read?: boolean; className?: string }) {
  if (sending) {
    return (
      <span className={cn("inline-flex text-text-tertiary", className)} aria-label="Enviando">
        <Clock3 className="size-3.5" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  if (read) {
    return (
      <span className={cn("inline-flex text-brand", className)} aria-label="Leído">
        <CheckCheck className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex text-text-tertiary", className)} aria-label="Enviado">
      <Check className="size-4" strokeWidth={2.25} aria-hidden />
    </span>
  );
}
