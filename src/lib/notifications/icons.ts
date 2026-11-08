import { Bell, Calendar, CircleCheck, Flag, Megaphone, MessageCircle, ShieldAlert, Tag, Wrench, type LucideIcon } from "lucide-react";
import type { NotificationTone } from "@/lib/profile/data";

/** Colores del icono según el tono (N1 y el aviso flotante). */
export const toneClasses: Record<NotificationTone, string> = {
  success: "bg-status-success-soft text-status-success",
  brand: "bg-option-blue text-brand",
  warm: "bg-option-orange text-illustration-ink",
  neutral: "bg-surface-muted text-text",
};

/** Icono según el tipo de notificación que llega de Supabase. */
export function notificationIcon(n: { kind: string; tone: NotificationTone; title: string }): LucideIcon {
  if (n.kind === "aviso") return Megaphone;
  if (n.kind === "messages") return MessageCircle;
  if (n.kind === "agenda") return Calendar;
  if (n.kind === "marketplace") return Tag;
  if (n.kind === "moderacion") return ShieldAlert;
  if (n.title.startsWith("Reportaron")) return Flag;
  if (/reporte|PQRS/i.test(n.title)) return Wrench;
  return n.tone === "success" ? CircleCheck : Bell;
}
