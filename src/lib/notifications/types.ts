import type { NotificationTone } from "@/lib/profile/data";

/** Notificación leída de Supabase (se puede pasar del servidor al cliente: sin componentes). */
export type RemoteNotification = {
  id: string;
  /** aviso · requests · agenda · messages · marketplace · moderacion */
  kind: string;
  tone: NotificationTone;
  title: string;
  body: string;
  when: string;
  unread: boolean;
  href: string;
};
